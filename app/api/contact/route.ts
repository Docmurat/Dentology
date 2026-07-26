// app/api/contact/route.ts
import { NextResponse, after } from "next/server";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { sendTelegramMessage, tgEscape } from "@/lib/telegram";
import { sendPushToStaff } from "@/lib/push";
import { createLead, markLeadNotified } from "@/lib/leads";
import {
  isHoneypotFilled,
  isTooFast,
  rateLimit,
  formatRetryAfter,
  getClientIp,
} from "@/lib/anti-spam";

type ContactPayload = {
  name: string;
  phone: string;
  contactMethod?: string;
  message?: string;
  consent?: boolean;
  context?: string;
  // Антиспам: скрытое поле и метка времени открытия формы.
  website?: string;
  startedAt?: number;
};

function isValidPayload(data: ContactPayload) {
  return Boolean(data.name?.trim() && data.phone?.trim());
}

// Ограничения длины: раньше их не было вовсе, и в теле запроса могло
// приехать сколько угодно текста — прямо в письмо и в Telegram.
const MAX_LENGTH: Record<string, number> = {
  name: 120,
  phone: 40,
  contactMethod: 120,
  message: 4000,
  context: 200,
};

function isTooLong(data: ContactPayload): boolean {
  return (
    (data.name?.length ?? 0) > MAX_LENGTH.name ||
    (data.phone?.length ?? 0) > MAX_LENGTH.phone ||
    (data.contactMethod?.length ?? 0) > MAX_LENGTH.contactMethod ||
    (data.message?.length ?? 0) > MAX_LENGTH.message ||
    (data.context?.length ?? 0) > MAX_LENGTH.context
  );
}

/**
 * Уведомления отправляются после ответа пользователю, а результат
 * пишется в заявку.
 *
 * Ответ не ждёт ни Telegram, ни почту, ни пуш: заявка уже в базе,
 * а Telegram с российских хостингов сейчас недоступен и висит до
 * таймаута — заставлять человека смотреть на «Отправка…» полминуты
 * ради канала уведомления неправильно.
 *
 * Функция асинхронная и дожидается всех каналов сознательно: вызывающий
 * код передаёт её в after(), а тот обрывает работу, как только колбэк
 * вернул управление. При «выстрелил и забыл» рантайм успевал свернуть
 * запрос раньше, чем уходило уведомление.
 */
async function notifyInBackground(
  leadId: string,
  body: ContactPayload,
  transporterConfigured: boolean
): Promise<void> {
  // Значок в шапке уведомления помогает различать тип с первого взгляда:
  // 📅 — заявка с курса, 🦷 — обычная заявка на консультацию.
  const isCourseRequest = (body.context || "")
    .trim()
    .toLowerCase()
    .startsWith("курс");
  const headerEmoji = isCourseRequest ? "📅" : "🦷";

  const tgText = [
    `${headerEmoji} <b>Новая заявка с сайта Lucenta</b>`,
    "",
    `<b>Имя:</b> ${tgEscape(body.name)}`,
    `<b>Телефон:</b> ${tgEscape(body.phone)}`,
    `<b>Способ связи:</b> ${tgEscape(body.contactMethod || "Не указан")}`,
    `<b>Заявка по:</b> ${tgEscape(body.context || "Общая заявка")}`,
    body.message ? `<b>Сообщение:</b> ${tgEscape(body.message)}` : "",
    "",
    "Все заявки: /admin/leads",
  ]
    .filter(Boolean)
    .join("\n");

  // Каналы независимы: падение одного не должно отменять остальные,
  // поэтому собираем их и ждём через allSettled.
  const tasks: Promise<unknown>[] = [];

  tasks.push(
    sendTelegramMessage(tgText)
      .then(() => markLeadNotified(leadId, "telegram", true))
      .catch((error) => {
        console.error("TELEGRAM_SEND_ERROR", error?.cause ?? error);
        return markLeadNotified(leadId, "telegram", false);
      })
  );

  // Пуш приходит на телефон тому, кто обрабатывает заявки.
  tasks.push(
    sendPushToStaff({
      title: isCourseRequest ? "📅 Заявка с курса" : "🦷 Новая заявка",
      body: `${body.name} · ${body.phone}${body.context ? ` · ${body.context}` : ""}`,
      url: "/moderator",
    })
      .then((result) => markLeadNotified(leadId, "push", result.ok))
      .catch((error) => {
        console.error("PUSH_SEND_FAILED", error);
        return markLeadNotified(leadId, "push", false);
      })
  );

  if (transporterConfigured) {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      CONTACT_TO_EMAIL,
      CONTACT_FROM_EMAIL,
    } = process.env;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER as string, pass: SMTP_PASS as string },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    const subject = body.context
      ? `Новая заявка (${body.context}) — Lucenta`
      : "Новая заявка с сайта Lucenta";

    const text = [
      `Имя: ${body.name}`,
      `Телефон: ${body.phone}`,
      `Способ связи: ${body.contactMethod || "Не указан"}`,
      `Сообщение: ${body.message || "Не указано"}`,
      `Заявка по: ${body.context || "Общая заявка"}`,
      `Согласие на обработку ПДн: да`,
    ].join("\n");

    const html = `
      <h2>Новая заявка с сайта Lucenta</h2>
      <p><strong>Имя:</strong> ${body.name}</p>
      <p><strong>Телефон:</strong> ${body.phone}</p>
      <p><strong>Способ связи:</strong> ${body.contactMethod || "Не указан"}</p>
      <p><strong>Сообщение:</strong><br />${(body.message || "Не указано").replace(/\n/g, "<br />")}</p>
      <p><strong>Заявка по:</strong> ${body.context || "Общая заявка"}</p>
      <p><strong>Согласие на обработку ПДн:</strong> да</p>
    `;

    tasks.push(
      transporter
        .sendMail({
          from: CONTACT_FROM_EMAIL,
          to: CONTACT_TO_EMAIL,
          subject,
          text,
          html,
        })
        .then(() => {
          transporter.close();
          return markLeadNotified(leadId, "email", true);
        })
        .catch((error) => {
          console.error("EMAIL_SEND_ERROR", error);
          transporter.close();
          return markLeadNotified(leadId, "email", false);
        })
    );
  }

  await Promise.allSettled(tasks);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload;

    // Скрытое поле заполнено — бот. Отвечаем «успехом», чтобы он
    // не подбирал обход.
    if (isHoneypotFilled(body.website)) {
      return NextResponse.json({
        ok: true,
        message: "Запрос отправлен. Мы свяжемся с вами.",
      });
    }

    // Форма отправлена быстрее, чем её физически можно заполнить.
    if (isTooFast(body.startedAt)) {
      return NextResponse.json({
        ok: true,
        message: "Запрос отправлен. Мы свяжемся с вами.",
      });
    }

    if (isTooLong(body)) {
      return NextResponse.json(
        { ok: false, message: "Слишком длинный текст в одном из полей." },
        { status: 400 }
      );
    }

    // Пять заявок с одного адреса в час. В разработке потолок выше,
    // иначе тестовые отправки исчерпывают лимит за пару минут.
    const limit = await rateLimit("contact", {
      limit: process.env.NODE_ENV === "production" ? 5 : 100,
      windowSec: 3600,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: `Слишком много заявок. Попробуйте через ${formatRetryAfter(limit.retryAfterSec)} или позвоните нам.`,
        },
        { status: 429 }
      );
    }

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { ok: false, message: "Заполните имя и телефон." },
        { status: 400 }
      );
    }

    // Согласие на обработку персональных данных (152-ФЗ) — обязательно.
    if (body.consent !== true) {
      return NextResponse.json(
        {
          ok: false,
          message: "Необходимо согласие на обработку персональных данных.",
        },
        { status: 400 }
      );
    }

    // ── Сохранение. Это единственный шаг, без которого заявка потеряна,
    //    поэтому он выполняется первым и его провал — ошибка для клиента.
    const leadId = crypto.randomUUID();
    const h = await headers();

    try {
      await createLead({
        id: leadId,
        name: body.name.trim(),
        phone: body.phone.trim(),
        contactMethod: body.contactMethod?.trim() || null,
        message: body.message?.trim() || null,
        context: body.context?.trim() || null,
        sourceIp: await getClientIp(),
        userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      });
    } catch (error) {
      console.error("LEAD_SAVE_ERROR", error);
      return NextResponse.json(
        {
          ok: false,
          message:
            "Не удалось принять заявку. Пожалуйста, позвоните нам — мы на связи.",
        },
        { status: 500 }
      );
    }

    const smtpConfigured = Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.CONTACT_TO_EMAIL &&
        process.env.CONTACT_FROM_EMAIL
    );

    if (!smtpConfigured) {
      console.error("EMAIL_NOT_CONFIGURED: заявка сохранена, письмо не уйдёт");
    }

    // Уведомления — после ответа. after() продлевает жизнь запроса ровно
    // настолько, чтобы каналы успели отработать; ответ пользователю
    // уходит немедленно.
    after(() => notifyInBackground(leadId, body, smtpConfigured));

    return NextResponse.json({
      ok: true,
      message: "Запрос отправлен. Мы свяжемся с вами.",
    });
  } catch (error) {
    console.error("CONTACT_FORM_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось отправить форму.",
      },
      { status: 500 }
    );
  }
}