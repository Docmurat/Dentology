"use client";

// components/endo-prices/endo-prices-interactive.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { PrimaryCtaButton } from "@/components/contact/contact-modal";
import { ToothIllustration } from "@/components/endo-prices/tooth-illustration";
import {
  estimate,
  formatRub,
  shortStageName,
  stageCost,
  stagesFor,
  type EndoPricesContent,
  type EndoScenario,
  type EndoStage,
  type ToothVisual,
} from "@/lib/endo-prices";
import { typography } from "@/lib/typography";

const CANAL_OPTIONS = [1, 2, 3, 4];

function canalsWord(n: number): string {
  if (n === 1) return "канал";
  if (n >= 2 && n <= 4) return "канала";
  return "каналов";
}

// Исходная картинка — до первого этапа. Объясняет, что изображено.
const START_TEXT: Record<EndoScenario, { title: string; text: string }> = {
  primary: {
    title: "С чего начинаем",
    text: "Зуб раньше не лечили. Под старой пломбой кариес, нерв воспалён, у верхушки корня может быть очаг воспаления.",
  },
  retreat: {
    title: "С чего начинаем",
    text: "Зуб уже лечили: каналы запломбированы не до конца, в канале может стоять штифт или остаться обломок инструмента, у верхушки корня — очаг воспаления.",
  },
};

function priceLabel(stage: EndoStage): string {
  if (!stage.price) return "";
  return `${stage.priceFrom ? "от " : ""}${formatRub(stage.price)}${stage.perCanal ? " за канал" : ""}`;
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className={`${typography.caption} text-[var(--color-gray-600)]`}>
        {label}
      </p>
      <div
        role="group"
        aria-label={label}
        className="mt-2 inline-flex flex-wrap gap-1 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-1"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`rounded-lg px-4 py-2 ${typography.bodySm} font-medium transition ${
                active
                  ? "bg-white text-[var(--color-navy)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  : "text-[var(--color-gray-600)] hover:text-[var(--color-navy)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EndoPricesInteractive({
  content,
}: {
  content: EndoPricesContent;
}) {
  const [scenario, setScenario] = useState<EndoScenario>("retreat");
  const [canals, setCanals] = useState(1);
  // -1 — исходное состояние, иначе индекс этапа в списке.
  const [active, setActive] = useState(-1);

  const stages = useMemo(
    () => stagesFor(content.stages, scenario),
    [content.stages, scenario],
  );
  const total = estimate(content.stages, scenario, canals);
  const extras = stages.filter((s) => s.optional && s.price);

  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Активный этап — тот, что сейчас в середине экрана. По нему меняется
  // картинка зуба. Наблюдатель пересоздаётся при смене сценария: список
  // этапов другой.
  useEffect(() => {
    const items = itemRefs.current.slice(0, stages.length + 1);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isFinite(index)) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [stages.length, scenario]);

  const current = active >= 0 ? stages[active] : undefined;
  const visual: ToothVisual = current?.visual ?? "start";
  const stepNumber = current ? stages.indexOf(current) + 1 : 0;

  const caption = current ? current.title : START_TEXT[scenario].title;
  const captionPrice = current ? priceLabel(current) : "";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8">
        <Segmented
          label="Зуб раньше лечили?"
          value={scenario}
          onChange={(value) => {
            setScenario(value);
            setActive(-1);
          }}
          options={[
            { value: "retreat", label: "Да, нужно перелечивание" },
            { value: "primary", label: "Нет, лечим впервые" },
          ]}
        />
        <Segmented
          label="Сколько каналов в зубе?"
          value={canals}
          onChange={setCanals}
          options={CANAL_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
        />
      </div>
      <p className={`mt-2 ${typography.caption} text-[var(--color-gray-500)]`}>
        Обычно у передних зубов один канал, у премоляров один-два, у моляров
        три-четыре. Точно видно на снимке.
      </p>

      {/* Общая обёртка закреплённого зуба и этапов: закрепление действует,
          только пока на экране этапы, и не наезжает на блок с итогом. */}
      <div>
        {/* Телефон и планшет: зуб закреплён вверху, этапы листаются под ним */}
        <div className="sticky top-14 z-20 -mx-6 mt-6 border-y border-[var(--color-gray-200)] bg-white/95 px-6 py-3 backdrop-blur sm:top-16 md:-mx-10 md:px-10 lg:hidden">
          <div className="flex items-center gap-4">
            <ToothIllustration
              visual={visual}
              scenario={scenario}
              className="h-28 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className={`${typography.eyebrowSm} text-[var(--color-teal)]`}>
                {current
                  ? `Этап ${stepNumber} из ${stages.length}`
                  : "Исходное состояние"}
              </p>
              <p className={`mt-1 ${typography.h4} text-[var(--color-navy)]`}>
                {caption}
              </p>
              {captionPrice ? (
                <p
                  className={`mt-1 ${typography.bodySm} font-medium text-[var(--color-navy-secondary)]`}
                >
                  {captionPrice}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:mt-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          {/* Компьютер: зуб закреплён слева */}
          <div className="hidden lg:block">
            <div className="sticky top-28 rounded-[28px] border border-[var(--color-gray-200)] bg-white p-8 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
              <ToothIllustration
                visual={visual}
                scenario={scenario}
                className="mx-auto h-[380px] w-auto"
              />
              <div className="mt-6 border-t border-[var(--color-gray-100)] pt-5">
                <p
                  className={`${typography.eyebrowSm} text-[var(--color-teal)]`}
                >
                  {current
                    ? `Этап ${stepNumber} из ${stages.length}`
                    : "Исходное состояние"}
                </p>
                <p className={`mt-2 ${typography.h4} text-[var(--color-navy)]`}>
                  {caption}
                </p>
                {captionPrice ? (
                  <p
                    className={`mt-1 ${typography.body} font-medium text-[var(--color-navy-secondary)]`}
                  >
                    {captionPrice}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <ol className="space-y-4 sm:space-y-6">
            <li
              ref={(el) => {
                itemRefs.current[0] = el;
              }}
              data-index={-1}
              className={`rounded-2xl border px-5 py-5 transition sm:px-6 ${
                active === -1
                  ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5"
                  : "border-[var(--color-gray-200)] bg-white"
              }`}
            >
              <p className={`${typography.h4} text-[var(--color-navy)]`}>
                {START_TEXT[scenario].title}
              </p>
              <p
                className={`mt-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
              >
                {START_TEXT[scenario].text}
              </p>
            </li>

            {stages.map((stage, index) => {
              const cost = stageCost(stage, canals);
              const isActive = index === active;
              return (
                <li
                  key={`${scenario}-${index}-${stage.title}`}
                  ref={(el) => {
                    itemRefs.current[index + 1] = el;
                  }}
                  data-index={index}
                  className={`rounded-2xl border px-5 py-5 transition sm:px-6 sm:py-6 ${
                    isActive
                      ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5 shadow-[0_6px_24px_rgba(0,0,0,0.06)]"
                      : "border-[var(--color-gray-200)] bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="flex min-w-0 gap-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                          isActive
                            ? "bg-[var(--color-teal)] text-white"
                            : "bg-[var(--color-gray-100)] text-[var(--color-navy)]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3
                          className={`${typography.h4} text-[var(--color-navy)]`}
                        >
                          {stage.title}
                        </h3>
                        {stage.optional && stage.condition ? (
                          <p
                            className={`mt-1 ${typography.caption} font-medium text-[var(--color-gold-strong)]`}
                          >
                            Нужен, {stage.condition}
                          </p>
                        ) : null}
                        {stage.text ? (
                          <p
                            className={`mt-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
                          >
                            {stage.text}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {stage.price ? (
                      <div className="shrink-0 pl-13 sm:pl-0 sm:text-right">
                        <p
                          className={`${typography.h4} whitespace-nowrap text-[var(--color-navy)]`}
                        >
                          {stage.priceFrom ? "от " : ""}
                          {formatRub(stage.price)}
                        </p>
                        {stage.perCanal ? (
                          <p
                            className={`${typography.caption} whitespace-nowrap text-[var(--color-gray-500)]`}
                          >
                            {canals > 1
                              ? `за канал · ${canals} ${canalsWord(canals)} = ${formatRub(cost)}`
                              : "за канал"}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-8 sm:py-10 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className={`${typography.eyebrow} text-white/60`}>
              Ориентировочно ·{" "}
              {scenario === "retreat" ? "перелечивание" : "первичное лечение"},{" "}
              {canals} {canalsWord(canals)}
            </p>
            <p
              className="mt-3 text-4xl font-semibold leading-none sm:text-5xl"
              aria-live="polite"
            >
              {total.fromPrice ? "от " : ""}
              {formatRub(total.base)}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
              {extras.length
                ? "Обязательные этапы. Если понадобятся дополнительные:"
                : "Все этапы лечения."}
            </p>
            {extras.length ? (
              <ul className="mt-2 space-y-1 text-sm leading-6 text-white/85">
                {extras.map((stage) => (
                  <li key={stage.title}>
                    + {stage.priceFrom ? "от " : ""}
                    {formatRub(stageCost(stage, canals))} —{" "}
                    {shortStageName(stage.title)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <PrimaryCtaButton
              context={`Стоимость: ${scenario === "retreat" ? "перелечивание" : "первичное лечение"}, ${canals} ${canalsWord(canals)}`}
            />
            <p className="text-sm leading-6 text-white/70 lg:text-right">
              Точную стоимость врач назовёт после оценки снимка.
            </p>
          </div>
        </div>

        {content.notes.length ? (
          <div className="mt-8 space-y-1 border-t border-white/15 pt-5 text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
            {content.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
