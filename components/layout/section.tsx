type SectionProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export function Section({ id, className = "", children }: SectionProps) {
  return (
    <section
      id={id}
      // scroll-mt нужен только якорным секциям (например /#directions).
      // Значения подобраны так, чтобы зазор от шапки до заголовка совпадал
      // со страницами /cases и /team (PageHero):
      //   мобильный: шапка 56px, PageHero pt-14 (56px), секция py-20 (80px) -> 32px
      //   десктоп:   шапка 80px, PageHero pt-18 (72px), секция py-28 (112px) -> 40px
      className={`px-6 md:px-10 ${
        id ? "scroll-mt-[32px] md:scroll-mt-[40px]" : ""
      } ${className}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}