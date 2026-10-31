import { getCurrentUser } from "@/lib/auth-guards";
import { emailToLogin } from "@/lib/auth-login";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Мой аккаунт
      </h1>
      {user ? (
        <p className="mt-2 text-sm text-[var(--color-gray-600)]">
          Логин для входа:{" "}
          <span className="font-medium">{emailToLogin(user.email)}</span>
        </p>
      ) : null}

      <div className="mt-8 max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
