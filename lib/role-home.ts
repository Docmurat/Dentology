// Куда вести пользователя после входа в зависимости от роли.
export function roleHome(role?: string | null): string {
  switch (role) {
    case "admin":
    case "editor":
      return "/admin";
    case "doctor":
      return "/doctor";
    case "patient":
      return "/cabinet";
    default:
      return "/cabinet";
  }
}
