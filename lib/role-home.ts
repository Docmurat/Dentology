// lib/role-home.ts
// Куда вести пользователя после входа в зависимости от роли.
export function roleHome(role?: string | null): string {
  switch (role) {
    case "admin":
    case "editor":
      return "/admin";
    case "doctor":
      return "/doctor";
    // Модератор обрабатывает заявки и отзывы — общая админка ему не нужна.
    case "moderator":
      return "/moderator";
    case "patient":
      return "/cabinet";
    default:
      return "/cabinet";
  }
}