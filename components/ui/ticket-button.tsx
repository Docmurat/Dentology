import Link from "next/link";

/**
 * Золотая кнопка с анимированным бликом (тот же эффект gold-sheen,
 * что на карточке «Обучение» в hero главной). Переиспользуемая.
 */
export function TicketButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[var(--color-gold)] px-6 py-4 text-sm font-medium text-white transition hover:opacity-90 ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "45%",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
          transform: "translateX(-160%) skewX(-20deg)",
          animation: "gold-sheen 4.5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
    </Link>
  );
}