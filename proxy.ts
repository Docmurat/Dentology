import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { roleHome } from "@/lib/role-home";

// В Next.js 16 middleware называется proxy.ts.
// Работает в Edge-среде, поэтому берём лёгкую конфигурацию Auth.js
// (без драйвера БД и bcrypt) — она умеет только проверять JWT-cookie.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as
    | { role?: "admin" | "editor" | "doctor" | "patient" }
    | undefined;
  const isLoggedIn = Boolean(req.auth);
  const role = user?.role;

  const isLoginPage = pathname === "/admin/login";
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/cabinet");

  // Не авторизован — на страницу входа.
  if (isProtected && !isLoginPage && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Уже вошёл — со страницы входа отправляем в его домашний раздел.
  if (isLoginPage && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  // Разграничение разделов по ролям.
  if (isLoggedIn && !isLoginPage) {
    const isStaff = role === "admin" || role === "editor";
    const isDoctor = role === "doctor" || role === "admin";

    if (pathname.startsWith("/admin") && !isStaff) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome(role);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/doctor") && !isDoctor) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome(role);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/cabinet/:path*"],
};