import { getHomepageBlocks, getHeroContent, getAboutContent, getWhenContent, getWhyContent, getSectionHeadingContent, getEducationContent, getCtaContent } from "@/lib/homepage";
import { toggleHomepageBlock, moveHomepageBlock } from "./actions";
import { HeroEditor } from "@/components/admin/hero-editor";
import { AboutEditor } from "@/components/admin/about-editor";
import { WhenEditor } from "@/components/admin/when-editor";
import { WhyEditor } from "@/components/admin/why-editor";
import { SectionHeadingEditor } from "@/components/admin/section-heading-editor";
import { EducationEditor } from "@/components/admin/education-editor";
import { CtaEditor } from "@/components/admin/cta-editor";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const blocks = await getHomepageBlocks();
  const heroContent = await getHeroContent();
  const aboutContent = await getAboutContent();
  const whenContent = await getWhenContent();
  const whyContent = await getWhyContent();
  const educationContent = await getEducationContent();
  const ctaContent = await getCtaContent();

  // Заголовки блоков с собственной механикой (карточки — из своих разделов).
  const headings: Record<string, Awaited<ReturnType<typeof getSectionHeadingContent>>> = {
    directions: await getSectionHeadingContent("directions"),
    cases: await getSectionHeadingContent("cases"),
    team: await getSectionHeadingContent("team"),
    reviews: await getSectionHeadingContent("reviews"),
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Конструктор главной страницы
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Включайте и выключайте блоки, меняйте их порядок. Выключенный блок
        просто не показывается на главной — данные не теряются.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {blocks.map((block, index) => (
            <li
              key={block.key}
              className={"px-5 py-4 " + (block.enabled ? "" : "opacity-60")}
            >
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-sm text-[var(--color-gray-400)]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-[var(--color-navy)]">
                    {block.title}
                    {block.enabled ? null : (
                      <span className="ml-2 rounded-full bg-[var(--color-gray-200)] px-2 py-0.5 text-xs text-[var(--color-gray-600)]">
                        скрыт
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {block.key}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <form action={moveHomepageBlock}>
                  <input type="hidden" name="key" value={block.key} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    disabled={index === 0}
                    className="rounded-lg border border-[var(--color-gray-200)] px-2.5 py-1 text-sm text-[var(--color-navy)] hover:bg-[var(--color-gray-50)] disabled:opacity-30"
                    aria-label="Выше"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveHomepageBlock}>
                  <input type="hidden" name="key" value={block.key} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    disabled={index === blocks.length - 1}
                    className="rounded-lg border border-[var(--color-gray-200)] px-2.5 py-1 text-sm text-[var(--color-navy)] hover:bg-[var(--color-gray-50)] disabled:opacity-30"
                    aria-label="Ниже"
                  >
                    ↓
                  </button>
                </form>

                <form action={toggleHomepageBlock}>
                  <input type="hidden" name="key" value={block.key} />
                  <input
                    type="hidden"
                    name="enabled"
                    value={block.enabled ? "false" : "true"}
                  />
                  <button
                    className={
                      "rounded-lg px-3 py-1.5 text-sm font-medium " +
                      (block.enabled
                        ? "text-red-600 hover:text-red-700"
                        : "text-[var(--color-teal)] hover:text-[var(--color-navy)]")
                    }
                  >
                    {block.enabled ? "Скрыть" : "Показать"}
                  </button>
                </form>
              </div>
              </div>

              {block.key === "hero" ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать содержимое
                  </summary>
                  <div className="mt-4">
                    <HeroEditor initial={heroContent} />
                  </div>
                </details>
              ) : null}

              {block.key === "about" ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать содержимое
                  </summary>
                  <div className="mt-4">
                    <AboutEditor initial={aboutContent} />
                  </div>
                </details>
              ) : null}

              {block.key === "when_to_apply" ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать содержимое
                  </summary>
                  <div className="mt-4">
                    <WhenEditor initial={whenContent} />
                  </div>
                </details>
              ) : null}

              {block.key === "why" ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать содержимое
                  </summary>
                  <div className="mt-4">
                    <WhyEditor initial={whyContent} />
                  </div>
                </details>
              ) : null}

              {["directions", "cases", "team", "reviews"].includes(block.key) ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать заголовок
                  </summary>
                  <div className="mt-4">
                    <SectionHeadingEditor
                      blockKey={block.key}
                      initial={headings[block.key]}
                    />
                  </div>
                </details>
              ) : null}

              {block.key === "education" ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать содержимое
                  </summary>
                  <div className="mt-4">
                    <EducationEditor initial={educationContent} />
                  </div>
                </details>
              ) : null}

              {block.key === "cta" ? (
                <details className="mt-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
                    Редактировать содержимое
                  </summary>
                  <div className="mt-4">
                    <CtaEditor initial={ctaContent} />
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}