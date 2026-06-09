import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name: string;
  phone: string;
  contactMethod?: string;
  message?: string;
};

function isValidPayload(data: ContactPayload) {
  return Boolean(data.name?.trim() && data.phone?.trim());
}

export async function POST(request: Request) {
  try {
    console.log("CONTACT_ROUTE_HIT");

    const body = (await request.json()) as ContactPayload;
    console.log("CONTACT_BODY", body);

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { ok: false, message: "Заполните имя и телефон." },
        { status: 400 }
      );
    }

    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      CONTACT_TO_EMAIL,
      CONTACT_FROM_EMAIL,
    } = process.env;

    console.log("ENV_CHECK", {
      SMTP_HOST: !!SMTP_HOST,
      SMTP_PORT: !!SMTP_PORT,
      SMTP_USER: !!SMTP_USER,
      SMTP_PASS: !!SMTP_PASS,
      CONTACT_TO_EMAIL: !!CONTACT_TO_EMAIL,
      CONTACT_FROM_EMAIL: !!CONTACT_FROM_EMAIL,
    });

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

    console.log("SMTP_CONFIG_READY");
    console.log("SENDMAIL_START");

    const subject = "Новая заявка с сайта Dentology";
    const text = [
      `Имя: ${body.name}`,
      `Телефон: ${body.phone}`,
      `Способ связи: ${body.contactMethod || "Не указан"}`,
      `Сообщение: ${body.message || "Не указано"}`,
    ].join("\n");

    const html = `
      <h2>Новая заявка с сайта Dentology</h2>
      <p><strong>Имя:</strong> ${body.name}</p>
      <p><strong>Телефон:</strong> ${body.phone}</p>
      <p><strong>Способ связи:</strong> ${body.contactMethod || "Не указан"}</p>
      <p><strong>Сообщение:</strong><br />${(body.message || "Не указано").replace(/\n/g, "<br />")}</p>
    `;

    transporter.sendMail({
  from: CONTACT_FROM_EMAIL,
  to: CONTACT_TO_EMAIL,
  subject,
  text,
  html,
})
  .then(() => {
    console.log("EMAIL_SENT_SUCCESS");
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