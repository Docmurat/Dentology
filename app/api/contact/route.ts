// app/api/contact/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { sendTelegramMessage, tgEscape } from "@/lib/telegram";
import {
  isHoneypotFilled,
  isTooFast,
  rateLimit,
  formatRetryAfter,
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

    // Пять заявок с одного адреса в час.
    const limit = await rateLimit("contact", { limit: 5, windowSec: 3600 });
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

    // Значок в шапке уведомления помогает различать тип с первого взгляда:
    // 📅 — заявка с курса, 🦷 — обычная заявка на консультацию.
    const isCourseRequest = (body.context || "")
      .trim()
      .toLowerCase()
      .startsWith("курс");
    const headerEmoji = isCourseRequest ? "📅" : "🦷";

    // Дублируем заявку в Telegram (если бот настроен) — до отправки письма,
    // чтобы заявка дошла даже при проблемах с почтой.
    const tgText = [
      `${headerEmoji} <b>Новая заявка с сайта Lucenta</b>`,
      "",
      `<b>Имя:</b> ${tgEscape(body.name)}`,
      `<b>Телефон:</b> ${tgEscape(body.phone)}`,
      `<b>Способ связи:</b> ${tgEscape(body.contactMethod || "Не указан")}`,
      `<b>Заявка по:</b> ${tgEscape(body.context || "Общая заявка")}`,
      body.message ? `<b>Сообщение:</b> ${tgEscape(body.message)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await sendTelegramMessage(tgText);

    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      CONTACT_TO_EMAIL,
      CONTACT_FROM_EMAIL,
    } = process.env;

    if (
      !SMTP_HOST ||
      !SMTP_PORT ||
      !SMTP_USER ||
      !SMTP_PASS ||
      !CONTACT_TO_EMAIL ||
      !CONTACT_FROM_EMAIL
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Почтовые настройки не заданы.",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
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
      })
      .catch((error) => {
        console.error("EMAIL_SEND_ERROR", error);
      });

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