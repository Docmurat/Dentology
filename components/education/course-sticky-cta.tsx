"use client";

import { useEffect, useState } from "react";
import { ContactButton } from "@/components/contact/contact-modal";

const FINAL_CTA_ID = "course-final-cta";

/**
 * Закреплённая кнопка заявки для телефона и планшета мини (до 1024px).
 * Появляется после первого экрана и прячется, когда виден финальный CTA,
 * чтобы не дублировать одну и ту же кнопку.
 */
export function CourseStickyCta({ courseTitle }: { courseTitle: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const target = document.getElementById(FINAL_CTA_ID);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFinalVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -15% 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const shown = scrolled && !finalVisible;

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-gray-200)] bg-white/95 px-4 pt-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        shown ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto w-full max-w-md">
        <ContactButton
          label="Оставить заявку"
          variant="gold"
          context={`Курс «${courseTitle}» — закреплённая кнопка`}
          title="Заявка на курс"
          className="w-full"
        />
      </div>
    </div>
  );
}