type CardProps = {
  className?: string;
  children: React.ReactNode;
  id?: string;
};

export function Card({ className = "", children, id }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,0.06)] md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}