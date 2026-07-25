// lib/leads.ts
import { query, queryOne } from "@/lib/db";

export const LEAD_STATUSES = ["new", "in_progress", "done", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Обработана",
  spam: "Спам",
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  contactMethod: string | null;
  message: string | null;
  context: string | null;
  status: LeadStatus;
  sourceIp: string | null;
  userAgent: string | null;
  notifiedEmail: boolean;
  notifiedTelegram: boolean;
  createdAt: string;
  handledAt: string | null;
};

type Row = {
  id: string;
  name: string;
  phone: string;
  contact_method: string | null;
  message: string | null;
  context: string | null;
  status: string;
  source_ip: string | null;
  user_agent: string | null;
  notified_email: boolean;
  notified_telegram: boolean;
  created_at: string;
  handled_at: string | null;
};

function mapRow(row: Row): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    contactMethod: row.contact_method,
    message: row.message,
    context: row.context,
    status: (LEAD_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as LeadStatus)
      : "new",
    sourceIp: row.source_ip,
    userAgent: row.user_agent,
    notifiedEmail: row.notified_email,
    notifiedTelegram: row.notified_telegram,
    createdAt: row.created_at,
    handledAt: row.handled_at,
  };
}

const COLUMNS =
  "id, name, phone, contact_method, message, context, status, source_ip, user_agent, notified_email, notified_telegram, created_at, handled_at";

export type NewLead = {
  id: string;
  name: string;
  phone: string;
  contactMethod?: string | null;
  message?: string | null;
  context?: string | null;
  sourceIp?: string | null;
  userAgent?: string | null;
};

/**
 * Сохраняет заявку. Вызывается ДО отправки уведомлений: канал доставки
 * не должен быть единственным местом, где живут данные.
 */
export async function createLead(lead: NewLead): Promise<void> {
  await query(
    `insert into leads
       (id, name, phone, contact_method, message, context, source_ip, user_agent)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      lead.id,
      lead.name,
      lead.phone,
      lead.contactMethod ?? null,
      lead.message ?? null,
      lead.context ?? null,
      lead.sourceIp ?? null,
      lead.userAgent ?? null,
    ]
  );
}

/** Отметка о доставке уведомления. Ошибку глушим: заявка уже сохранена. */
export async function markLeadNotified(
  id: string,
  channel: "email" | "telegram",
  ok: boolean
): Promise<void> {
  const column = channel === "email" ? "notified_email" : "notified_telegram";
  try {
    await query(`update leads set ${column} = $1 where id = $2`, [ok, id]);
  } catch (err) {
    console.error("markLeadNotified:", err);
  }
}

export async function getLeads(status?: LeadStatus): Promise<Lead[]> {
  const rows = status
    ? await query<Row>(
        `select ${COLUMNS} from leads where status = $1 order by created_at desc limit 500`,
        [status]
      )
    : await query<Row>(
        `select ${COLUMNS} from leads order by created_at desc limit 500`
      );
  return rows.map(mapRow);
}

/** Счётчики по статусам — для вкладок и бейджа «новых». */
export async function getLeadCounts(): Promise<Record<string, number>> {
  const rows = await query<{ status: string; count: number }>(
    `select status, count(*)::int as count from leads group by status`
  );
  const out: Record<string, number> = { all: 0 };
  for (const row of rows) {
    out[row.status] = Number(row.count);
    out.all += Number(row.count);
  }
  return out;
}

export async function getNewLeadCount(): Promise<number> {
  try {
    const row = await queryOne<{ count: number }>(
      `select count(*)::int as count from leads where status = 'new'`
    );
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}