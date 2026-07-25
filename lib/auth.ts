// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { authConfig, type UserRole } from "@/lib/auth.config";

export type { UserRole };

type ProfileRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: UserRole;
  doctor_slug: string | null;
};

// Полная конфигурация Auth.js: вход по email + паролю (bcrypt),
// сессия в подписанном JWT-cookie. Пользователи — таблица profiles.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const profile = await queryOne<ProfileRow>(
          `select id, email, password_hash, full_name, role, doctor_slug
             from profiles where lower(email) = $1`,
          [email]
        );
        if (!profile) return null;

        const ok = await bcrypt.compare(password, profile.password_hash);
        if (!ok) return null;

        // Доступ к заявкам и отзывам приходит из двух мест: роль
        // «moderator» у самой учётной записи ИЛИ галочка в карточке
        // команды, к которой аккаунт привязан. Так модератором можно
        // сделать и врача, и ассистента, не меняя им роль.
        let isModerator = profile.role === "moderator";
        if (!isModerator && profile.doctor_slug) {
          const card = await queryOne<{ is_moderator: boolean | null }>(
            `select is_moderator from team_members where slug = $1`,
            [profile.doctor_slug]
          );
          isModerator = Boolean(card?.is_moderator);
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name ?? profile.email,
          role: profile.role,
          doctorSlug: profile.doctor_slug,
          isModerator,
        };
      },
    }),
  ],
});