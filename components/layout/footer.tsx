import Link from "next/link";
import { Section } from "@/components/layout/section";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-gray-200)] bg-[var(--color-navy)] text-white">
      <Section className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-2xl font-semibold">Dentology</h3>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
              Стоматологическая практика с ведущей экспертизой в сложной
              эндодонтии и комплексным подходом к лечению.
            </p>

            <div className="mt-6 space-y-2 text-sm leading-7 text-white/70">
              <p>Москва</p>
              <p>Пациенты обращаются также из других регионов.</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.16em] text-white/50">
              Навигация
            </h4>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
              <Link href="/">Главная</Link>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/#directions">Направления</a>
              <Link href="/cases">Клинические случаи</Link>
              <Link href="/team">Команда</Link>
              <Link href="/about">О враче</Link>
              <Link href="/education">Education</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.16em] text-white/50">
              Направления
            </h4>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
              <Link href="/directions/endodontics">Эндодонтия</Link>
              <Link href="/directions/implantation">Имплантация</Link>
              <Link href="/directions/orthodontics">Ортодонтия</Link>
              <Link href="/directions/gnathology">Гнатология</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.16em] text-white/50">
              Контакты
            </h4>
            <div className="mt-5 space-y-3 text-sm leading-7 text-white/80">
              <p>Телефон: +7 (___) ___-__-__</p>
              <p>Email: hello@dentology.ru</p>
              <p>Telegram / WhatsApp</p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
          © Dentology. Все права защищены.
        </div>
      </Section>
    </footer>
  );
}
