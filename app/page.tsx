import type { Metadata } from "next";
import type { ComponentType } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { AboutDentology } from "@/components/sections/about-dentolog";
import { WhenToApply } from "@/components/home/when-to-apply";
import { Directions } from "@/components/home/directions";
import { WhyDentology } from "@/components/home/why-dentology";
import { CasesPreview } from "@/components/home/cases-preview";
import { TeamPreview } from "@/components/home/team-preview";
import { EducationPreview } from "@/components/home/education-preview";
import { CtaSection } from "@/components/home/cta-section";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { PromoBanner } from "@/components/home/promo-banner";
import { getEnabledHomepageBlocks } from "@/lib/homepage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Стоматологическая практика",
  description:
    "Lucenta — стоматологическая практика в Москве с ведущей экспертизой в сложной эндодонтии, имплантации, ортодонтии и гнатологии.",
};

// Реестр: какой ключ блока какому компоненту соответствует.
// Рендерятся только блоки из этого реестра.
const BLOCKS = {
  hero: Hero,
  about: AboutDentology,
  when_to_apply: WhenToApply,
  directions: Directions,
  why: WhyDentology,
  cases: CasesPreview,
  team: TeamPreview,
  reviews: ReviewsPreview,
  education: EducationPreview,
  cta: CtaSection,
  promo: PromoBanner,
} as unknown as Record<string, ComponentType>;

export default async function HomePage() {
  const blocks = await getEnabledHomepageBlocks();

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-[var(--color-navy)]">
        {blocks.map((block) => {
          const Block = BLOCKS[block.key];
          return Block ? <Block key={block.key} /> : null;
        })}
      </main>

      <Footer />
    </>
  );
}