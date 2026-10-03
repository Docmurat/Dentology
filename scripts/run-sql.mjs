// scripts/run-sql.mjs
//
// Применяет SQL-файлы к базе сайта. Подключение — те же переменные
// окружения, что у приложения (см. lib/db.ts).
//
// Запуск из корня проекта на сервере:
//   node --env-file=.env scripts/run-sql.mjs db/migrations/<файл>.sql [ещё файлы]
//
// Локально (через SSH-туннель) вместо .env указывается .env.local.
//
// Каждый файл выполняется в одной транзакции: либо применяется целиком,
// либо не применяется вовсе. По каждой команде печатается, сколько строк
// она затронула, — так видно, что именно изменилось.

import fs from "node:fs";
import pg from "pg";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Укажите хотя бы один .sql файл.");
  process.exit(1);
}

if (!process.env.PGHOST || !process.env.PGDATABASE) {
  console.error(
    "Не заданы PGHOST / PGDATABASE. Запускайте с --env-file=.env (на сервере) или --env-file=.env.local."
  );
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
        ? { ca, rejectUnauthorized: true }
        : { rejectUnauthorized: false },
});

await client.connect();

let failed = false;

for (const file of files) {
  const sql = fs.readFileSync(file, "utf8");
  console.log(`\n── ${file}`);

  try {
    await client.query("begin");
    const result = await client.query(sql);
    await client.query("commit");

    const results = Array.isArray(result) ? result : [result];
    for (const r of results) {
      if (!r.command) continue;
      const count = r.rowCount ?? 0;
      console.log(`   ${r.command}: ${count}`);
    }
    console.log("   готово");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    failed = true;
    console.error(`   ОШИБКА, файл не применён: ${error.message}`);
    break;
  }
}

await client.end();
process.exit(failed ? 1 : 0);
