import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Лицензия на медицинскую деятельность",
  robots: { index: true, follow: true },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[var(--color-gray-100)] py-3 last:border-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <span className="text-sm text-[var(--color-gray-500)]">{label}</span>
      <span className="text-sm text-[var(--color-navy)]">{value}</span>
    </div>
  );
}

export default function LicensePage() {
  const l = COMPANY.license;

  return (
    <SiteShell>
      <Section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold text-[var(--color-navy)] md:text-4xl">
            Лицензия на медицинскую деятельность
          </h1>
          <p className="mt-3 text-sm text-[var(--color-gray-500)]">
            {COMPANY.fullName} ({COMPANY.shortName})
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <Card>
              <Row label="Статус лицензии" value={l.status} />
              <Row label="Регистрационный номер" value={l.number} />
              <Row label="Дата предоставления" value={l.date} />
              <Row label="Лицензирующий орган" value={l.authority} />
              <Row label="Вид деятельности" value={l.activity} />
              <Row label="ОГРН" value={COMPANY.ogrn} />
              <Row label="ИНН" value={COMPANY.inn} />
              <Row label="Адрес места нахождения" value={COMPANY.address} />
            </Card>

            <div className="flex flex-col items-center gap-3">
              <div className="w-[180px] overflow-hidden rounded-xl border border-[var(--color-gray-200)] bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/license-qr.svg"
                  alt="QR-код выписки из реестра лицензий"
                  className="h-auto w-full"
                />
              </div>
              <p className="max-w-[220px] text-center text-xs leading-5 text-[var(--color-gray-500)]">
                Отсканируйте QR-код и введите ОГРН{" "}
                <span className="font-medium text-[var(--color-navy)]">
                  {COMPANY.ogrn}
                </span>{" "}
                для проверки лицензии в реестре Росздравнадзора
              </p>
              <a
                href={l.registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--color-teal)] underline hover:opacity-80"
              >
                Проверить в реестре лицензий
              </a>
              {l.extractUrl ? (
                <a
                  href={l.extractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--color-navy)] underline hover:opacity-80"
                >
                  Скачать выписку из реестра
                </a>
              ) : null}
            </div>
          </div>

          <p className="mt-8 text-sm leading-7 text-[var(--color-gray-600)]">
            Сведения о лицензии соответствуют выписке из реестра лицензий,
            сформированной на интернет-портале Росздравнадзора. Актуальный
            статус и полный перечень адресов осуществления деятельности можно
            проверить по QR-коду или ссылке на реестр.
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}