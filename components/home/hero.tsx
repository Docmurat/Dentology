import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/contact/contact-modal";
import { Section } from "@/components/layout/section";
import { getHeroContent } from "@/lib/homepage";

export async function Hero() {
  const hero = await getHeroContent();

  return (
    <Section className="pt-6 pb-20 md:pt-8 md:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-6 text-sm uppercase tracking-[0.22em] text-[var(--color-gray-500)]">
            {hero.eyebrow}
          </p>

          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.06] text-[var(--color-navy)] md:text-6xl">
            {hero.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-gray-700)]">
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ContactButton label="Записаться на консультацию" variant="teal" />
            <Button href="/cases" variant="secondary">
              Клинические случаи
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-5">
              <p className="text-sm text-[var(--color-gray-500)]">
                {hero.card1Label}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-navy)]">
                {hero.card1Value}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-5">
              <p className="text-sm text-[var(--color-gray-500)]">
                {hero.card2Label}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-navy)]">
                {hero.card2Value}
              </p>
            </div>

            <Link
              href="/education"
              className="relative block overflow-hidden rounded-2xl border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-4 py-5 transition hover:bg-[var(--color-gold)]/20"
            >
              <div className="relative z-10">
                <p className="text-sm font-medium text-[var(--color-gold)]">
                  Обучение
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-navy)]">
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

        <div className="relative max-w-[520px] ml-auto">
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
            <div className="absolute bottom-6 left-6 right-6">
              <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
                <p className="text-[32px] leading-none text-white/40">“</p>

                <p className="mt-2 text-base leading-7 text-[var(--color-navy)]">
                  {hero.quote}
                </p>

                {hero.quoteCaption ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--color-gray-600)]">
                    {hero.quoteCaption}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}