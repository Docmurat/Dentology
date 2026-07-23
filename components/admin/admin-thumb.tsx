import Image from "next/image";

// Лёгкая миниатюра для админских списков и превью.
// next/image отдаёт уменьшенный оптимизированный вариант (обычно несколько КБ)
// вместо полноразмерного файла из хранилища — списки грузятся быстро.
//
// className задаёт размер контейнера (напр. "h-12 w-16"), sizes должен
// примерно соответствовать отображаемой ширине (напр. "80px").
export function AdminThumb({
  url,
  alt = "",
  className = "h-12 w-16",
  sizes = "80px",
  rounded = "rounded-md",
  placeholder = "нет фото",
}: {
  url: string | null | undefined;
  alt?: string;
  className?: string;
  sizes?: string;
  rounded?: string;
  placeholder?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[var(--color-gray-100)] ${rounded} ${className}`}
    >
      {url ? (
        <Image src={url} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center text-[10px] leading-tight text-[var(--color-gray-400)]">
          {placeholder}
        </div>
      )}
    </div>
  );
}