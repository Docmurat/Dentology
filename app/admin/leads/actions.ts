// app/admin/leads/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { requireModerator, requireAdmin } from "@/lib/auth-guards";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads";

function isStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

function revalidateLeads() {
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  revalidatePath("/moderator");
}

export async function setLeadStatusAction(formData: FormData) {
  // Модератор — тот, ради кого раздел и существует.
  const user = await requireModerator();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !isStatus(status)) return;

  // handled_at заполняем при уходе из «новых» и снимаем при возврате —
  // так видно, когда заявку реально взяли в работу.
  await query(
    `update leads
        set status = $1,
            handled_at = case when $1 = 'new' then null else now() end,
            handled_by = case when $1 = 'new' then null else $2::uuid end
      where id = $3`,
    [status, user.id, id]
  );

  revalidateLeads();
}

/**
 * Удаление заявки — только администратор и только из статуса «Спам».
 *
 * Заявка это персональные данные и след обращения пациента: удалять её
 * по невнимательности нельзя. Мусор сначала помечается спамом.
 */
export async function deleteLead(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) return;

  const row = await queryOne<{ status: string }>(
    `select status from leads where id = $1`,
    [id]
  );
  if (!row) return;

  if (row.status !== "spam") {
    console.warn(`deleteLead: заявка ${id} не помечена спамом, удаление отклонено`);
    return;
  }

  await query(`delete from leads where id = $1`, [id]);

  revalidateLeads();
}