import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { AboutDentology } from "@/components/sections/about-dentolog";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { WhenToApply } from "@/components/home/when-to-apply";
import { Directions } from "@/components/home/directions";
import { WhyDentology } from "@/components/home/why-dentology";
import { CasesPreview } from "@/components/home/cases-preview";
import { TeamPreview } from "@/components/home/team-preview";
import { EducationPreview } from "@/components/home/education-preview";
import { CtaSection } from "@/components/home/cta-section";
import { ReviewsPreview } from "@/components/home/reviews-preview";

export const metadata: Metadata = {
  title: "Стоматологическая практика",
  description:
    "Dentology — стоматологическая практика в Москве с ведущей экспертизой в сложной эндодонтии, имплантации, ортодонтии и гнатологии.",
};

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-[var(--color-navy)]">
        <Hero />
        <AboutDentology />
        <WhenToApply />
        <Directions />
        <WhyDentology />
        <CasesPreview />
        <TeamPreview />
        <ReviewsPreview />
        <EducationPreview />
        <CtaSection />
      </main>

      <Footer />
    </>
  );
}