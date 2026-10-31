// scripts/admin-access.mjs
//
// Восстановление входа в админку, если забыт логин или пароль.
// Работает только на сервере (или через туннель): доступ к серверу сам
// по себе подтверждает, что это владелец сайта.
//
//   node --env-file=.env scripts/admin-access.mjs
//       — показать учётные записи администраторов и редакторов
//
//   node --env-file=.env scripts/admin-access.mjs --reset ЛОГИН
//       — задать этой записи новый случайный пароль и показать его
//
// Логин — то, что вводится на странице входа: короткий логин или email.

import crypto from "node:crypto";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import pg from "pg";

const LOGIN_DOMAIN = "dentology.local"; // как в lib/auth-login.ts

function loginToEmail(login) {
  const value = login.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${LOGIN_DOMAIN}`;
}

function emailToLogin(email) {
  const suffix = `@${LOGIN_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

// Без похожих символов (0/O, 1/l/I), чтобы пароль легко переписать.
function newPassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

if (!process.env.PGHOST || !process.env.PGDATABASE) {
  console.error("Не заданы PGHOST / PGDATABASE. Запускайте с --env-file=.env.");
  process.exit(1);
}

const caPath =
  process.env.PGSSLROOTCERT || `${process.env.HOME}/.postgresql/root.crt`;
let ca;
try {
  ca = fs.readFileSync(caPath, "utf8");
} catch {
  ca = undefined;
}
const viaTunnel = ["localhost", "127.0.0.1", "::1"].includes(process.env.PGHOST);

const client = new pg.Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 6432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : ca
        ? {
            ca,
            rejectUnauthorized: true,
            ...(viaTunnel ? { checkServerIdentity: () => undefined } : {}),
          }
        : { rejectUnauthorized: false },
});

await client.connect();

try {
  const resetIndex = process.argv.indexOf("--reset");

  if (resetIndex === -1) {
    const { rows } = await client.query(
      `select email, full_name, role from profiles
        where role in ('admin', 'editor')
        order by role, email`
    );
    if (!rows.length) {
      console.log("Учётных записей администраторов и редакторов нет.");
    } else {
      console.log("Вход: https://lucenta.ru/admin/login\n");
      for (const row of rows) {
        const role = row.role === "admin" ? "администратор" : "редактор";
        console.log(
          `  логин: ${emailToLogin(row.email)}   (${role}${row.full_name ? `, ${row.full_name}` : ""})`
        );
      }
      console.log("\nНовый пароль: node --env-file=.env scripts/admin-access.mjs --reset ЛОГИН");
    }
  } else {
    const login = process.argv[resetIndex + 1];
    if (!login) {
      console.error("Укажите логин: --reset ЛОГИН");
      process.exitCode = 1;
    } else {
      const email = loginToEmail(login);
      const found = await client.query(
        `select id, role from profiles where lower(email) = $1`,
        [email]
      );
      const profile = found.rows[0];
      if (!profile) {
        console.error(`Учётная запись «${login}» не найдена. Список: запустите скрипт без --reset.`);
        process.exitCode = 1;
      } else if (!["admin", "editor"].includes(profile.role)) {
        console.error("Это не учётная запись администратора или редактора — меняйте её пароль в админке.");
        process.exitCode = 1;
      } else {
        const password = newPassword();
        const hash = await bcrypt.hash(password, 10);
        await client.query(
          `update profiles set password_hash = $1 where id = $2`,
          [hash, profile.id]
        );
        console.log(`Пароль изменён.\n\n  логин:  ${emailToLogin(email)}\n  пароль: ${password}\n`);
        console.log("Запишите его в менеджер паролей. Старый пароль больше не работает.");
      }
    }
  }
} finally {
  await client.end();
}
