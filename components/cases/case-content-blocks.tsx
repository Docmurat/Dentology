import type { ContentBlock } from "@/lib/cases-data";
import { CaseImages } from "@/components/cases/image-lightbox";

export function CaseContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const visible = blocks.filter(
    (b) => b.title?.trim() || b.body?.trim() || b.images?.length
  );

  if (!visible.length) return null;

  return (
    <div className="space-y-10">
      {visible.map((block, index) => {
        const hasImages = block.images?.length > 0;
        const floated = hasImages && block.float !== "none";

        return (
          <div key={index} className="overflow-hidden">
            {block.title ? (
              <h2 className="mb-4 text-2xl font-semibold text-[var(--color-navy)]">
                {block.title}
              </h2>
            ) : null}

            {/* Обтекаемое фото: только на md+, на мобильном идёт сверху во всю ширину */}
            {floated ? (
              <div
                className={`mb-4 md:w-[45%] ${
                  block.float === "left"
                    ? "md:float-left md:mr-6"
                    : "md:float-right md:ml-6"
                }`}
              >
                <CaseImages images={block.images} />
              </div>
            ) : null}

            {block.body ? (
              <p className="whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
                {block.body}
              </p>
            ) : null}

            {/* Без обтекания — фото сеткой под текстом */}
            {hasImages && block.float === "none" ? (
              <div className="mt-4">
                <CaseImages images={block.images} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}