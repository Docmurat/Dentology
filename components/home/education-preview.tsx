import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { TicketButton } from "@/components/ui/ticket-button";
import { getEducationContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";

export async function EducationPreview() {
  const edu = await getEducationContent();

  return (
    <Section id="education" className="py-20 md:py-28">
      <Card className="bg-[var(--color-gray-50)]">
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow={edu.eyebrow}
              title={edu.title}
              description={edu.description}
            />

            <div className="mt-6 sm:mt-8">
              <TicketButton href="/education">{edu.primaryLabel}</TicketButton>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--color-gray-200)] bg-white p-4 sm:p-6">
            <p className={`${typography.eyebrow} text-[var(--color-gold)]`}>
              {edu.badge}
            </p>
            <div
              className={`mt-4 space-y-3 sm:mt-5 sm:space-y-4 ${typography.bodySm} text-[var(--color-gray-700)]`}
            >
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