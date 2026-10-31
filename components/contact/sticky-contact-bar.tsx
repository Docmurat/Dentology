import { PrimaryCtaButton } from "@/components/contact/contact-modal";
import { COMPANY } from "@/lib/company";
import { typography } from "@/lib/typography";
import { XRAY_UPLOAD_ENABLED } from "@/lib/constants";

/**
 * Закреплённая панель связи внизу экрана: телефон и кнопка заявки.
 *
 * Показывается на телефоне и планшете (до xl): там в шапке только меню,
 * и до кнопки записи нужно листать. На широком экране кнопка и телефон
 * уже есть в шапке, которая и так закреплена.
 *
 * Под панель в конце страницы оставлен отступ (см. Footer), чтобы она
 * не закрывала последние строки подвала.
 */
export function StickyContactBar() {
  const tel = COMPANY.phone.replace(/[^\d+]/g, "");

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-gray-200)] bg-white/95 backdrop-blur xl:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <a
          href={`tel:${tel}`}
          aria-label={`Позвонить: ${COMPANY.phone}`}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--color-navy)] px-4 py-3 ${typography.bodySm} font-medium text-[var(--color-navy)]`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="sm:hidden">Позвонить</span>
          <span className="hidden sm:inline">{COMPANY.phone}</span>
        </a>

        {/* Короткая подпись: полная «Отправить снимок на оценку» на узком
            телефоне рядом с кнопкой звонка уходит в две строки. */}
        <PrimaryCtaButton
          label={XRAY_UPLOAD_ENABLED ? "Отправить снимок" : "Записаться"}
          // «!» обязателен: без него базовые отступы кнопки (px-6 py-4)
          // перекрывают эти — порядок классов в строке ничего не решает.
          className="min-w-0 flex-1 px-3! py-3!"
        />
      </div>
    </div>
  );
}
