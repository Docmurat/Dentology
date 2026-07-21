import { COMPANY } from "@/lib/company";

// Текст, который подставится при написании из сайта.
const MESSAGE =
  "Здравствуйте! Пишу с сайта Lucenta — хочу записаться на консультацию.";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2z" />
    </svg>
  );
}

const btn =
  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90";

export function MessengerButtons() {
  const tg = COMPANY.telegram.replace(/^@/, "").trim();
  let wa = COMPANY.whatsapp.replace(/[^\d]/g, "");
  // Российский номер с «8» -> международный «7» для ссылки wa.me.
  if (wa.length === 11 && wa.startsWith("8")) {
    wa = "7" + wa.slice(1);
  }

  if (!tg && !wa) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {tg ? (
        <a
          href={`https://t.me/${tg}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          style={{ backgroundColor: "#229ED9" }}
        >
          <TelegramIcon />
          Telegram
        </a>
      ) : null}

      {wa ? (
        <a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(MESSAGE)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          style={{ backgroundColor: "#25D366" }}
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
      ) : null}
    </div>
  );
}