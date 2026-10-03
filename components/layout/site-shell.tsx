import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StickyContactBar } from "@/components/contact/sticky-contact-bar";

type SiteShellProps = {
  children: React.ReactNode;
  /**
   * Закреплённая панель связи для пациентов (телефон + «Отправить снимок»).
   * Выключается на страницах обучения: там аудитория — врачи, и у курса
   * своя закреплённая кнопка заявки.
   */
  contactBar?: boolean;
};

export function SiteShell({ children, contactBar = true }: SiteShellProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white text-[var(--color-navy)]">
        {children}
      </main>
      <Footer withContactBar={contactBar} />
      {contactBar ? <StickyContactBar /> : null}
    </>
  );
}
