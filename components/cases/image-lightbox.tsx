"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Пределы масштабирования. Верхняя граница — 3x осознанно: фотографии
// сжимаются при загрузке до 1600px по большей стороне (lib/image-compress.ts),
// на экране снимок занимает около 1200px. Дальше 3x растёт не детализация,
// а мыло — ограничение честнее, чем иллюзия глубокого зума.
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const TAP_SCALE = 2.5;
const WHEEL_STEP = 1.15;
const DOUBLE_TAP_MS = 300;

type View = { s: number; x: number; y: number };
const RESET: View = { s: 1, x: 0, y: 0 };

/**
 * Полноэкранный просмотр набора фото.
 *
 * Управление: Esc — закрыть, стрелки — листать, 0 — сбросить масштаб.
 * Щипок двумя пальцами и Ctrl+колесо увеличивают саму фотографию;
 * двойное касание или двойной клик переключают 1x ↔ 2.5x с центром в точке
 * нажатия; в увеличенном состоянии снимок перетаскивается одним пальцем
 * или мышью и не отрывается от краёв экрана.
 *
 * Рендерится порталом в document.body, чтобы оверлей не зажимался
 * родителями с transform или overflow.
 */
export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const count = images.length;
  const single = count <= 1;

  const [view, setView] = useState<View>(RESET);
  const [smooth, setSmooth] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Актуальное состояние для нативных обработчиков: они навешиваются один
  // раз и не должны переподписываться на каждое движение пальца. Запись
  // идёт в эффекте, а не в теле рендера — правило react-hooks/refs.
  const viewRef = useRef<View>(RESET);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Был ли жест перетаскиванием. Нужно, чтобы отпускание пальца после
  // панорамирования не считалось кликом по фону и не закрывало окно.
  const movedRef = useRef(false);

  // Смена фото сбрасывает масштаб здесь, а не в эффекте по index: иначе
  // это setState внутри эффекта, который догоняет пропс с опозданием на
  // кадр. Индекс меняется только отсюда — из стрелок и с клавиатуры.
  const go = useCallback(
    (i: number) => {
      setSmooth(false);
      setView(RESET);
      onIndexChange(((i % count) + count) % count);
    },
    [count, onIndexChange]
  );

  const centerOf = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return { cx: 0, cy: 0 };
    const r = vp.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }, []);

  // Ограничение сдвига: увеличенный снимок не должен отрываться от краёв.
  // offsetWidth берётся у неотмасштабированного контейнера, поэтому на него
  // не влияет собственный transform.
  const clamp = useCallback((v: View): View => {
    const frame = frameRef.current;
    const vp = viewportRef.current;
    if (!frame || !vp) return v;

    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s));
    const maxX = Math.max(0, (frame.offsetWidth * s - vp.clientWidth) / 2);
    const maxY = Math.max(0, (frame.offsetHeight * s - vp.clientHeight) / 2);

    return {
      s,
      x: Math.min(maxX, Math.max(-maxX, v.x)),
      y: Math.min(maxY, Math.max(-maxY, v.y)),
    };
  }, []);

  // Масштабирование «вокруг точки»: содержимое под пальцем или курсором
  // остаётся на месте. Точка задаётся относительно центра области просмотра.
  const zoomAt = useCallback(
    (nextScale: number, fx: number, fy: number, from: View) => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const k = s / from.s;
      setView(
        clamp({
          s,
          x: fx - (fx - from.x) * k,
          y: fy - (fy - from.y) * k,
        })
      );
    },
    [clamp]
  );

  // Клавиатура. Отдельным эффектом: onClose приходит из родителя как новая
  // функция на каждом рендере, и раньше вместе с ним переподписывалась
  // блокировка прокрутки — в блоке «до / после» она успевала сняться и
  // вернуться несколько раз подряд из-за onLoad у картинок.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "0") {
        setSmooth(true);
        setView(RESET);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, go, onClose]);

  // Фиксация страницы под окном. Ставится один раз на всё время жизни
  // окна и ни от чего не зависит.
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    // Safari шлёт собственные события масштабирования страницы — гасим их,
    // чтобы щипок доставался фотографии, а не всему документу.
    const stopGesture = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", stopGesture);
    document.addEventListener("gesturechange", stopGesture);

    return () => {
      document.removeEventListener("gesturestart", stopGesture);
      document.removeEventListener("gesturechange", stopGesture);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Жесты. Слушатели навешиваются вручную с passive: false — React вешает
  // touchmove пассивно, и preventDefault внутри onTouchMove не сработал бы.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    let mode: "none" | "pan" | "pinch" = "none";
    let startDist = 1;
    let start: View = RESET;
    let originX = 0;
    let originY = 0;
    let lastTap = 0;

    function onTouchStart(e: TouchEvent) {
      setSmooth(false);
      movedRef.current = false;
      start = viewRef.current;

      if (e.touches.length === 2) {
        mode = "pinch";
        const [a, b] = [e.touches[0], e.touches[1]];
        startDist =
          Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
        e.preventDefault();
        return;
      }

      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      originX = t.clientX;
      originY = t.clientY;

      const now = Date.now();
      if (now - lastTap < DOUBLE_TAP_MS) {
        const { cx, cy } = centerOf();
        setSmooth(true);
        if (viewRef.current.s > MIN_SCALE) setView(RESET);
        else zoomAt(TAP_SCALE, t.clientX - cx, t.clientY - cy, viewRef.current);
        lastTap = 0;
        mode = "none";
        movedRef.current = true;
        e.preventDefault();
        return;
      }

      lastTap = now;
      mode = viewRef.current.s > MIN_SCALE ? "pan" : "none";
    }

    function onTouchMove(e: TouchEvent) {
      if (mode === "pinch" && e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dist =
          Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
        const { cx, cy } = centerOf();
        movedRef.current = true;
        zoomAt(
          start.s * (dist / startDist),
          (a.clientX + b.clientX) / 2 - cx,
          (a.clientY + b.clientY) / 2 - cy,
          start
        );
        e.preventDefault();
        return;
      }

      if (mode === "pan" && e.touches.length === 1) {
        const t = e.touches[0];
        movedRef.current = true;
        setView(
          clamp({
            s: start.s,
            x: start.x + (t.clientX - originX),
            y: start.y + (t.clientY - originY),
          })
        );
        e.preventDefault();
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
        mode = "none";
        return;
      }
      // После щипка на экране остался один палец — продолжаем как
      // перетаскивание, иначе снимок «залипает» до полного отпускания.
      if (e.touches.length === 1 && viewRef.current.s > MIN_SCALE) {
        mode = "pan";
        start = viewRef.current;
        originX = e.touches[0].clientX;
        originY = e.touches[0].clientY;
      }
    }

    // Ctrl + колесо и щипок на трекпаде приходят как wheel с ctrlKey.
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const { cx, cy } = centerOf();
      setSmooth(false);
      zoomAt(
        viewRef.current.s * (e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP),
        e.clientX - cx,
        e.clientY - cy,
        viewRef.current
      );
    }

    // Перетаскивание мышью в увеличенном состоянии.
    function onPointerDown(e: PointerEvent) {
      if (!vp) return;
      if (e.pointerType === "touch" || viewRef.current.s <= MIN_SCALE) return;
      setSmooth(false);
      movedRef.current = false;
      start = viewRef.current;
      originX = e.clientX;
      originY = e.clientY;
      mode = "pan";
      vp.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (mode !== "pan" || e.pointerType === "touch") return;
      movedRef.current = true;
      setView(
        clamp({
          s: start.s,
          x: start.x + (e.clientX - originX),
          y: start.y + (e.clientY - originY),
        })
      );
    }

    function onPointerUp(e: PointerEvent) {
      if (!vp) return;
      if (e.pointerType === "touch") return;
      mode = "none";
      if (vp.hasPointerCapture(e.pointerId)) {
        vp.releasePointerCapture(e.pointerId);
      }
    }

    vp.addEventListener("touchstart", onTouchStart, { passive: false });
    vp.addEventListener("touchmove", onTouchMove, { passive: false });
    vp.addEventListener("touchend", onTouchEnd);
    vp.addEventListener("touchcancel", onTouchEnd);
    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("pointerdown", onPointerDown);
    vp.addEventListener("pointermove", onPointerMove);
    vp.addEventListener("pointerup", onPointerUp);
    vp.addEventListener("pointercancel", onPointerUp);

    return () => {
      vp.removeEventListener("touchstart", onTouchStart);
      vp.removeEventListener("touchmove", onTouchMove);
      vp.removeEventListener("touchend", onTouchEnd);
      vp.removeEventListener("touchcancel", onTouchEnd);
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("pointerdown", onPointerDown);
      vp.removeEventListener("pointermove", onPointerMove);
      vp.removeEventListener("pointerup", onPointerUp);
      vp.removeEventListener("pointercancel", onPointerUp);
    };
  }, [centerOf, clamp, zoomAt]);

  if (typeof document === "undefined") return null;

  const zoomed = view.s > MIN_SCALE;

  function closeFromBackdrop() {
    // Отпускание пальца после перетаскивания — не клик по фону.
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    onClose();
  }

  function toggleZoom(clientX: number, clientY: number) {
    const { cx, cy } = centerOf();
    setSmooth(true);
    if (zoomed) setView(RESET);
    else zoomAt(TAP_SCALE, clientX - cx, clientY - cy, view);
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[100] overscroll-contain bg-black/90"
      style={{ touchAction: "none" }}
      onClick={closeFromBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Закрыть"
        className="fixed right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur transition hover:bg-white/25 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
      >
        ✕
      </button>

      {/* Листание прячем в увеличенном состоянии: стрелки перекрывают
          снимок ровно там, где его тянут пальцем. */}
      {!single && !zoomed ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(index - 1);
            }}
            aria-label="Предыдущее фото"
            className="fixed left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(index + 1);
            }}
            aria-label="Следующее фото"
            className="fixed right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ›
          </button>
        </>
      ) : null}

      <div
        ref={viewportRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden p-3 sm:p-6"
      >
        <div
          ref={frameRef}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            toggleZoom(e.clientX, e.clientY);
          }}
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
            transition: smooth ? "transform 180ms ease-out" : "none",
            cursor: zoomed ? "grab" : "zoom-in",
            willChange: "transform",
          }}
          className="max-h-full max-w-full"
        >
          <Image
            src={images[index]}
            alt=""
            width={1600}
            height={1200}
            sizes="(max-width: 1024px) 100vw, 1200px"
            priority
            draggable={false}
            className="block h-auto max-h-full w-auto max-w-full select-none object-contain sm:rounded-lg"
          />
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/15 px-3 py-1 text-sm text-white backdrop-blur">
        {!single ? (
          <span>
            {index + 1} / {count}
          </span>
        ) : null}
        <span>{Math.round(view.s * 100)}%</span>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

// Кликабельная галерея фото кейса: миниатюры + полноэкранный просмотр.
export function CaseImages({ images }: { images: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const single = images.length === 1;
  // Одна картинка — во всю ширину, две и больше — сеткой по две в ряд.
  // Три штуки укладываются как 2 + 1 (последняя занимает всю ширину).
  const three = images.length === 3;

  return (
    <>
      {single ? (
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          aria-label="Открыть фото"
          className="group block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)]"
        >
          <Image
            src={images[0]}
            alt=""
            width={800}
            height={600}
            sizes="(max-width: 768px) 100vw, 800px"
            className="block h-auto w-full transition group-hover:opacity-95"
          />
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label="Открыть фото"
              className={`group cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)] ${
                three && i === 2 ? "col-span-2" : ""
              }`}
            >
              <div className={three && i === 2 ? "aspect-[16/9]" : "aspect-[4/3]"}>
                <Image
                  src={url}
                  alt=""
                  width={500}
                  height={375}
                  sizes="(max-width: 768px) 50vw, 400px"
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {openIndex !== null ? (
        <Lightbox
          images={images}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      ) : null}
    </>
  );
}