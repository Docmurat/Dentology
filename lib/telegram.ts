// Отправка сообщения в Telegram через Bot API.
// Настройка в .env.local: TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
// Если переменные не заданы — тихо пропускаем (форма продолжает работать).

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function tgEscape(value: string): string {
  return escapeHtml(value);
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(    
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("TELEGRAM_SEND_ERROR", res.status, await res.text());
    }
  } catch (error) {
    console.error("TELEGRAM_SEND_ERROR", error);
  }
}