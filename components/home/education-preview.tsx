import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getEducationContent } from "@/lib/homepage";

export async function EducationPreview() {
  const edu = await getEducationContent();

  return (
    <Section id="education" className="py-20 md:py-28">
      <Card className="bg-[var(--color-gray-50)]">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow={edu.eyebrow}
              title={edu.title}
              description={edu.description}
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button href="/education">{edu.primaryLabel}</Button>
              <Button href="#contacts" variant="secondary">
                {edu.secondaryLabel}
              </Button>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--color-gray-200)] bg-white p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-gold)]">
              {edu.badge}
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-gray-700)]">
              {edu.bullets.map((b, i) => (
                <p key={i}>— {b}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}