import Image from "next/image";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function MemberPhoto({
  src,
  name,
  priority = false,
}: {
  src: string;
  name: string;
  priority?: boolean;
}) {
  const hasImage = Boolean(src && src.trim());

  return (
    <div className="aspect-[3/4] w-full bg-[var(--color-gray-100)]">
      {hasImage ? (
        <Image
          src={src}
          alt={name}
          width={600}
          height={800}
          priority={priority}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-3xl font-semibold tracking-wide text-[var(--color-gray-500)]">
            {getInitials(name)}
          </span>
        </div>
      )}
    </div>
  );
}