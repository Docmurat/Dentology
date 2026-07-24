import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/contact/contact-modal";
import { Section } from "@/components/layout/section";
import { getHeroContent } from "@/lib/homepage";

export async function Hero() {
  const hero = await getHeroContent();

  return (
    // Отступ сверху зависит от того, есть ли блок над Hero:
    // если сверху стоит информационная плашка — компактно (pt-6/pt-8),
    // если Hero первый на странице — больше воздуха (first:pt-12 / md:first:pt-16).
    <Section className="pt-6 pb-20 first:pt-12 md:pt-8 md:pb-28 md:first:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.14em] text-[var(--color-gray-500)] sm:mb-6 sm:text-sm sm:tracking-[0.22em]">
            {hero.eyebrow}
          </p>

          <h1 className="max-w-4xl break-words text-2xl font-semibold leading-[1.2] text-[var(--color-navy)] sm:text-4xl sm:leading-[1.06] md:text-5xl lg:text-4xl xl:text-6xl">
            {hero.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-gray-700)] sm:mt-6 sm:text-lg sm:leading-8 lg:text-base lg:leading-7 xl:text-lg xl:leading-8">
            {hero.subtitle}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <ContactButton label="Записаться на консультацию" variant="teal" />
            <Button href="/cases" variant="secondary">
              Клинические случаи
            </Button>
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-3 sm:px-4 sm:py-5">
              <p className="text-[11px] text-[var(--color-gray-500)] sm:text-sm">
                {hero.card1Label}
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--color-navy)] sm:mt-2 sm:text-sm sm:leading-6">
                {hero.card1Value}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-3 sm:px-4 sm:py-5">
              <p className="text-[11px] text-[var(--color-gray-500)] sm:text-sm">
                {hero.card2Label}
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--color-navy)] sm:mt-2 sm:text-sm sm:leading-6">
                {hero.card2Value}
              </p>
            </div>

            <Link
              href="/education"
              className="relative col-span-2 block overflow-hidden rounded-2xl border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-3 py-3 transition hover:bg-[var(--color-gold)]/20 sm:col-span-1 sm:px-4 sm:py-5"
            >
              <div className="relative z-10">
                <p className="text-[11px] font-medium text-[var(--color-gold)] sm:text-sm">
                  Обучение
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-[var(--color-navy)] sm:mt-2 sm:text-sm sm:leading-6">
                  Курсы для врачей стоматологов
                </p>
              </div>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: "45%",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)",
                  transform: "translateX(-160%) skewX(-20deg)",
                  animation: "gold-sheen 4.5s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            </Link>
          </div>
        </div>

        {/* На планшете (768–1023px) цитата выносится текстом слева, а фото
            уменьшается и прижимается вправо. На телефоне и десктопе —
            прежняя плашка поверх фотографии. */}
        <div className="md:flex md:items-center md:gap-8 lg:block">
          {hero.quote ? (
            <figure className="hidden border-l-2 border-[var(--color-teal)] pl-5 md:block md:flex-1 lg:hidden">
              <blockquote className="font-serif text-xl italic leading-8 text-[var(--color-navy)]">
                {hero.quote}
              </blockquote>

              {hero.quoteCaption ? (
                <figcaption className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--color-gray-500)]">
                  {hero.quoteCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <div className="relative mx-auto w-full max-w-[520px] md:mx-0 md:w-[300px] md:shrink-0 lg:w-full lg:max-w-[520px] lg:ml-auto">
            <div className="rounded-[32px] bg-[var(--color-gray-100)] shadow-[0_12px_36px_rgba(0,0,0,0.06)]">
              <div className="overflow-hidden rounded-[32px]">
                <Image
                  src={hero.photo}
                  alt={hero.quoteCaption || "Lucenta"}
                  width={1000}
                  height={1300}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>

            {hero.quote ? (
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 md:hidden lg:block">
                <div className="rounded-2xl border border-white/30 bg-white/60 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-6">
                  <p className="text-[20px] leading-none text-white/40 sm:text-[32px]">“</p>

                  <p className="mt-1 text-xs leading-5 text-[var(--color-navy)] sm:mt-2 sm:text-base sm:leading-7">
                    {hero.quote}
                  </p>

                  {hero.quoteCaption ? (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-gray-600)] sm:mt-4 sm:text-xs sm:tracking-[0.18em]">
                      {hero.quoteCaption}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}