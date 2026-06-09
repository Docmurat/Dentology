import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white text-[var(--color-navy)]">
        {children}
      </main>
      <Footer />
    </>
  );
}