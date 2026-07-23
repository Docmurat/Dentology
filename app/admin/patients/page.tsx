import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { emailToLogin } from "@/lib/auth-login";
import { CreatePatientForm } from "@/components/admin/create-patient-form";
import { PatientRow } from "@/components/admin/patient-row";

export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  // Только администратору (layout пускает admin+editor).
  const me = await getCurrentUser();

  if (me?.role !== "admin") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Пациенты
        </h1>
        <p className="mt-3 text-sm text-[var(--color-gray-600)]">
          Управление аккаунтами доступно только администратору.
        </p>
      </div>
    );
  }

  // Аккаунты пациентов теперь целиком в таблице profiles.
  const patients = await query<{
    id: string;
    email: string;
    full_name: string | null;
  }>(
    `select id, email, full_name from profiles
      where role = 'patient'
      order by created_at desc`
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Пациенты
        </h1>
        <p className="mt-2 text-sm text-[var(--color-gray-600)]">
          Создавайте логины для пациентов, чтобы они могли заходить в личный
          кабинет. Пароли доступны только администратору.
        </p>
      </div>

      <CreatePatientForm />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-500)]">
          Пациенты ({patients.length})
        </h2>

        {patients.length ? (
          <div className="space-y-4">
            {patients.map((p) => (
              <PatientRow
                key={p.id}
                id={p.id}
                email={emailToLogin(p.email)}
                fullName={p.full_name}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            Пока нет аккаунтов пациентов. Создайте первый выше.
          </p>
        )}
      </div>
    </div>
  );
}