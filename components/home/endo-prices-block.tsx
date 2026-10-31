import { Section } from "@/components/layout/section";
import { EndoPricesContentBlock } from "@/components/endo-prices/endo-prices-section";

// Блок главной «Этапы и стоимость лечения каналов».
export async function EndoPricesBlock() {
  return (
    <Section id="prices" className="py-20 md:py-28">
      <EndoPricesContentBlock variant="home" />
    </Section>
  );
}
