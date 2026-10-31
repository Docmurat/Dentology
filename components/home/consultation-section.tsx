import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ConsultationInfo } from "@/components/consultation/consultation-info";
import { getConsultationContent } from "@/lib/homepage";

// Блок главной «Как проходит консультация».
export async function ConsultationSection() {
  const c = await getConsultationContent();

  return (
    <Section id="consultation" className="py-20 md:py-28">
      <SectionHeading
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
      />

      <div className="mt-8 sm:mt-12">
        <ConsultationInfo />
      </div>
    </Section>
  );
}
