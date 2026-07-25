// components/admin/leads-board.tsx
import Link from "next/link";
import {
  getLeads,
  getLeadCounts,
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  type LeadStatus,
} from "@/lib/leads";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { setLeadStatusAction, deleteLead } from "@/app/admin/leads/actions";

// Общий список заявок. Используется админкой и кабинетом модератора,
// поэтому базовый адрес для вкладок приходит снаружи.
export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusBadge: Record<LeadStatus, string> = {
  new: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  spam: "bg-[var(--color-gray-200)] text-[var(--color-gray-600)]",
};

function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: LeadStatus;
  label: string;
}) {
  return (
    <form action={setLeadStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="text-sm text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]">
        {label}
      </button>
    </form>
  );
}

export async function LeadsBoard({
  active,
  basePath,
  canDelete = false,
}: {
  active: LeadStatus | null;
  /** Адрес раздела: /admin/leads или /moderator. */
  basePath: string;
  /** Удаление доступно только администратору. */
  canDelete?: boolean;
}) {
  const [leads, counts] = await Promise.all([
    getLeads(active ?? undefined),
    getLeadCounts(),
  ]);

  const tabs = [
    { key: "all", href: basePath, label: "Все", count: counts.all ?? 0 },
    ...LEAD_STATUSES.map((s) => ({
      key: s,
      href: `${basePath}?status=${s}`,
      label: LEAD_STATUS_LABEL[s],
      count: counts[s] ?? 0,
    })),
  ];

  return (
    <>
      {/* Фильтр по статусу */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = (tab.key === "all" && !active) || tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={
                "rounded-full px-3 py-1.5 text-sm font-medium transition " +
                (isActive
                  ? "bg-[var(--color-navy)] text-white"
                  : "border border-[var(--color-gray-200)] bg-white text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]")
              }
            >
              {tab.label}
              <span
                className={
                  isActive
                    ? "ml-1.5 opacity-70"
                    : "ml-1.5 text-[var(--color-gray-500)]"
                }
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {leads.length ? (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-navy)]">
                    {lead.name}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[lead.status]}`}
                    >
                      {LEAD_STATUS_LABEL[lead.status]}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-[var(--color-navy)]">
                    <a
                      href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {lead.phone}
                    </a>
                    {lead.contactMethod ? (
                      <span className="text-[var(--color-gray-600)]">
                        {" · "}
                        {lead.contactMethod}
                      </span>
                    ) : null}
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                    {fmtDate(lead.createdAt)}
                    {lead.context ? ` · ${lead.context}` : " · Общая заявка"}
                  </p>

                  {/* Кто последним менял статус — чтобы коллеги видели,
                      что заявку уже взяли, и не звонили дважды. */}
                  {lead.handledByName ? (
                    <p className="mt-1 text-xs font-medium text-[var(--color-navy-secondary)]">
                      {LEAD_STATUS_LABEL[lead.status]}: {lead.handledByName}
                      {lead.handledAt ? ` · ${fmtDate(lead.handledAt)}` : ""}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
                  {lead.status !== "in_progress" ? (
                    <StatusButton
                      id={lead.id}
                      status="in_progress"
                      label="В работу"
                    />
                  ) : null}
                  {lead.status !== "done" ? (
                    <StatusButton id={lead.id} status="done" label="Обработана" />
                  ) : null}
                  {lead.status !== "spam" ? (
                    <StatusButton id={lead.id} status="spam" label="Спам" />
                  ) : null}
                  {lead.status !== "new" ? (
                    <StatusButton id={lead.id} status="new" label="Вернуть" />
                  ) : null}

                  {/* Удаление только из «Спама» и только у администратора:
                      заявка — персональные данные и след обращения. */}
                  {canDelete && lead.status === "spam" ? (
                    <form action={deleteLead}>
                      <input type="hidden" name="id" value={lead.id} />
                      <ConfirmDeleteButton title={`заявку — ${lead.name}`} />
                    </form>
                  ) : null}
                </div>
              </div>

              {lead.message ? (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-[var(--color-gray-50)] px-4 py-3 text-sm leading-6 text-[var(--color-gray-700)]">
                  {lead.message}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-gray-500)]">
                <span>
                  Почта: {lead.notifiedEmail ? "отправлена" : "не дошла"}
                </span>
                <span>
                  Telegram: {lead.notifiedTelegram ? "отправлен" : "не дошёл"}
                </span>
                {lead.sourceIp ? <span>IP: {lead.sourceIp}</span> : null}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            {active
              ? `Заявок со статусом «${LEAD_STATUS_LABEL[active]}» нет.`
              : "Заявок пока нет."}
          </p>
        )}
      </div>
    </>
  );
}