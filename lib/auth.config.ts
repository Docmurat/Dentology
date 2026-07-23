import type { NextAuthConfig } from "next-auth";

export type UserRole = "admin" | "editor" | "doctor" | "patient";

// Лёгкая конфигурация без обращения к БД и bcrypt — её использует middleware,
// который выполняется в Edge-среде (там нет драйвера PostgreSQL).
// Полная конфигурация с проверкой пароля лежит в lib/auth.ts.
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    // Кладём роль и привязку врача в токен при входе.
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: UserRole;
          doctorSlug?: string | null;
        };
        token.uid = u.id;
        token.role = u.role;
        token.doctorSlug = u.doctorSlug ?? null;
      }
      return token;
    },
    // Прокидываем их в session, чтобы читать в коде.
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        (session.user as { doctorSlug?: string | null }).doctorSlug =
          (token.doctorSlug as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;