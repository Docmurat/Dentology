// components/endo-prices/tooth-illustration.tsx
import type { EndoScenario, ToothVisual } from "@/lib/endo-prices";

/**
 * Моляр в разрезе: два корня, два канала, кость и десна.
 *
 * Картинка собрана из слоёв, каждый слой показывается или прячется в
 * зависимости от этапа. Этапы идут по порядку (ORDER), поэтому слой
 * описывается условием «с какого этапа и до какого он виден».
 * Перелечивание и первичное лечение отличаются исходным состоянием:
 * старая пломбировка, штифт и обломок — или воспалённая пульпа.
 */

const ORDER: ToothVisual[] = [
  "start",
  "prebuild",
  "post",
  "instrument",
  "canals",
  "restored",
  "control",
];

const C = {
  bone: "#EDF1F3",
  boneLine: "#D8DFE4",
  gum: "#F2D2CD",
  dentin: "#F6EFE4",
  enamel: "#FFFDF8",
  outline: "#0B1F33",
  oldFill: "#A3ACB9",
  decay: "#7A5240",
  pulp: "#E07A6F",
  oldRoot: "#B9C0CA",
  post: "#7D8796",
  postLight: "#B5BDC8",
  fragment: "#2B3644",
  gutta: "#E39A6E",
  build: "#7CC6C9",
  lesion: "#E07A6F",
};

const TOOTH =
  "M44,124 C38,84 42,50 64,38 C80,30 96,42 110,40 C122,38 130,30 142,30 C156,30 166,40 178,38 C196,36 204,56 202,80 C200,100 202,114 196,126 C192,140 188,152 186,168 C184,210 182,250 176,290 C174,302 162,304 158,292 C152,256 146,222 132,198 C126,190 114,190 108,198 C94,222 88,256 82,292 C78,304 66,302 64,290 C58,250 56,210 54,168 C52,152 48,140 44,124 Z";
const ENAMEL =
  "M44,124 C38,84 42,50 64,38 C80,30 96,42 110,40 C122,38 130,30 142,30 C156,30 166,40 178,38 C196,36 204,56 202,80 C200,100 202,114 196,126 C170,118 150,116 120,116 C90,116 70,118 44,124 Z";
const CHAMBER =
  "M88,112 C88,98 100,94 120,94 C140,94 152,98 152,112 C152,126 146,140 140,152 L100,152 C94,140 88,126 88,112 Z";
const CANAL_LEFT = "M100,150 C92,200 82,250 73,288";
const CANAL_RIGHT = "M140,150 C148,200 158,250 167,288";
// Старая пломбировка не доходит до верхушки — частая причина перелечивания.
const OLD_LEFT = "M100,150 C94,190 88,222 84,244";
const OLD_RIGHT = "M140,150 C146,190 152,222 156,244";

function Layer({
  show,
  opacity = 1,
  children,
}: {
  show: boolean;
  opacity?: number;
  children: React.ReactNode;
}) {
  return (
    <g
      style={{
        opacity: show ? opacity : 0,
        transition: "opacity 450ms ease",
      }}
    >
      {children}
    </g>
  );
}

export function ToothIllustration({
  visual,
  scenario,
  className = "",
}: {
  visual: ToothVisual;
  scenario: EndoScenario;
  className?: string;
}) {
  const step = ORDER.indexOf(visual);
  const at = (from: ToothVisual, until?: ToothVisual) =>
    step >= ORDER.indexOf(from) &&
    (until === undefined || step < ORDER.indexOf(until));
  const retreat = scenario === "retreat";

  // Очаг у верхушки: на этапе лечения каналов он ещё есть, после
  // восстановления бледнеет, на контроле его нет.
  const lesionOpacity = step < ORDER.indexOf("canals") ? 0.55 : step < ORDER.indexOf("control") ? 0.3 : 0;

  return (
    <svg
      viewBox="0 0 240 330"
      role="img"
      aria-hidden="true"
      className={className}
    >
      {/* Кость и десна */}
      <rect x="10" y="150" width="220" height="176" rx="18" fill={C.bone} />
      <path d="M10,150 Q120,134 230,150 L230,172 Q120,158 10,172 Z" fill={C.gum} />
      <path d="M24,210 H216 M24,250 H216 M24,290 H216" stroke={C.boneLine} strokeWidth="1" strokeDasharray="3 6" />

      {/* Очаг воспаления у верхушек */}
      <g style={{ opacity: lesionOpacity, transition: "opacity 600ms ease" }}>
        <circle cx="72" cy="296" r="17" fill={C.lesion} />
        <circle cx="168" cy="296" r="21" fill={C.lesion} />
      </g>

      {/* Сам зуб */}
      <path d={TOOTH} fill={C.dentin} stroke={C.outline} strokeWidth="2" strokeLinejoin="round" />
      <path d={ENAMEL} fill={C.enamel} />

      {/* Пульпа: воспалённая (первичное) или пустая камера (перелечивание) */}
      <Layer show={!retreat && at("start", "canals")}>
        <path d={CHAMBER} fill={C.pulp} />
        <path d={CANAL_LEFT} stroke={C.pulp} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d={CANAL_RIGHT} stroke={C.pulp} strokeWidth="7" strokeLinecap="round" fill="none" />
      </Layer>
      <Layer show={retreat}>
        <path d={CHAMBER} fill={C.dentin} stroke={C.oldRoot} strokeWidth="1.5" />
      </Layer>

      {/* Перелечивание: старая пломбировка каналов, не до верхушки */}
      <Layer show={retreat && at("start", "canals")}>
        <path d={OLD_LEFT} stroke={C.oldRoot} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d={OLD_RIGHT} stroke={C.oldRoot} strokeWidth="7" strokeLinecap="round" fill="none" />
      </Layer>

      {/* Перелечивание: штифт в правом канале */}
      <Layer show={retreat && at("start", "post")}>
        <path d="M136,108 L144,108 L152,214 L146,218 Z" fill={C.post} stroke={C.outline} strokeWidth="1" />
        <path d="M138,112 L140,112 L147,204 L145,205 Z" fill={C.postLight} />
      </Layer>

      {/* Перелечивание: обломок инструмента в левом канале */}
      <Layer show={retreat && at("start", "instrument")}>
        <path d="M86,236 L80,262" stroke={C.fragment} strokeWidth="4" strokeLinecap="round" />
      </Layer>

      {/* Каналы очищены и запломбированы до верхушки */}
      <Layer show={at("canals")}>
        <path d={CANAL_LEFT} stroke={C.gutta} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d={CANAL_RIGHT} stroke={C.gutta} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M100,150 L140,150" stroke={C.gutta} strokeWidth="6" strokeLinecap="round" />
      </Layer>

      {/* Исходное состояние коронки: старая пломба и кариес у стенки */}
      <Layer show={at("start", "prebuild")}>
        <path d="M80,58 C96,50 146,50 162,58 L156,104 C140,110 100,110 84,104 Z" fill={C.oldFill} stroke={C.outline} strokeWidth="1" />
        <path d="M160,60 C172,64 180,80 176,98 C170,92 164,82 160,60 Z" fill={C.decay} />
      </Layer>

      {/* Пребилд: стенки восстановлены, доступ к каналам открыт */}
      <Layer show={at("prebuild", "restored")}>
        <path d="M58,44 C66,38 74,40 82,46 L88,106 C76,110 64,114 54,118 C48,96 48,62 58,44 Z" fill={C.build} opacity="0.85" />
        <path d="M182,44 C174,38 166,40 158,46 L152,106 C164,110 176,114 186,118 C192,96 192,62 182,44 Z" fill={C.build} opacity="0.85" />
      </Layer>
      <Layer show={at("prebuild", "restored")}>
        <path d="M98,42 C110,38 130,38 142,42 L146,100 L94,100 Z" fill="#FFFFFF" stroke={C.outline} strokeWidth="1" strokeDasharray="3 3" />
      </Layer>

      {/* Пост-билдап: коронковая часть восстановлена и закрыта */}
      <Layer show={at("restored")}>
        <path d="M60,46 C76,34 98,44 110,42 C122,40 130,34 142,34 C156,34 166,44 180,42 C192,46 196,70 194,96 C176,104 160,108 140,108 L100,108 C80,108 66,104 50,98 C48,72 50,54 60,46 Z" fill={C.enamel} stroke={C.build} strokeWidth="2.5" strokeDasharray="5 4" />
      </Layer>
    </svg>
  );
}
