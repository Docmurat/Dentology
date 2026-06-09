import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-hover)]",
  secondary:
    "border border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]",
  ghost:
    "text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]",
};

export function Button({
  children,
  href = "/",
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl px-6 py-4 text-sm font-medium transition-colors duration-200 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}