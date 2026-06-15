import Image from "next/image";
import type { ContentBlock } from "@/lib/cases-data";

function BlockImages({ images }: { images: string[] }) {
  if (!images.length) return null;

  // Одно фото — крупно во всю ширину контейнера; несколько — сеткой 2 в ряд.
  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)]">
        <Image
          src={images[0]}
          alt=""
          width={800}
          height={600}
          className="block h-auto w-full"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((url) => (
        <div
          key={url}
          className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)]"
        >
          <div className="aspect-[4/3]">
            <Image
              src={url}
              alt=""
              width={500}
              height={375}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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
                <BlockImages images={block.images} />
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
                <BlockImages images={block.images} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
