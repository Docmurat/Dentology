import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { emailToLogin } from "@/lib/auth-login";
import { CreatePatientForm } from "@/components/admin/create-patient-form";
import { PatientRow } from "@/components/admin/patient-row";

export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  // Только администратору (layout пускает admin+editor).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

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

  // Список аккаунтов пациентов (auth.users + profiles) через сервисный клиент.
  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, role, full_name");

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const patients = (list?.users ?? [])
    .map((u) => {
      const p = byId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        role: p?.role ?? null,
        fullName: p?.full_name ?? null,
      };
    })
    .filter((d) => d.role === "patient");

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
                fullName={p.fullName}
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