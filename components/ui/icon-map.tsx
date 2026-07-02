import type { ComponentType } from "react";
import {
  ToothIcon,
  ImplantIcon,
  OrthoIcon,
  GnathologyIcon,
  TeamIcon,
  MethodIcon,
  AcademicIcon,
  PracticeIcon,
} from "@/components/ui/icons";

type IconComp = ComponentType<{ className?: string }>;
type IconProps = { className?: string };

// Общие атрибуты для новых кастомных иконок (тот же стиль, что в icons.tsx).
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ShieldIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6l-7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function HeartIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 19c-3-2-7-5-7-9 0-2 1.6-3.5 3.5-3.5 1.5 0 2.7.9 3.5 2 .8-1.1 2-2 3.5-2C17.4 6.5 19 8 19 10c0 4-4 7-7 9Z" />
    </svg>
  );
}

function StarIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.3l5-.7L12 4Z" />
    </svg>
  );
}

function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function MicroscopeIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 20h9" />
      <path d="M10 20a5 5 0 0 0 4.5-7.2" />
      <path d="M9.5 6.5l3 3L10 12 7 9z" />
      <path d="M12.5 9.5 15 7" />
    </svg>
  );
}

function SparkleIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5l1.4 3.6L17 10l-3.6 1.4L12 15l-1.4-3.6L7 10l3.6-1.4L12 5Z" />
      <path d="M18 15l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
    </svg>
  );
}

function CheckIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12l2.2 2.2 4.8-4.8" />
    </svg>
  );
}

function ChatIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 6h14v9H9l-4 3V6Z" />
      <path d="M9 9.5h6M9 12h4" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M9 3v4M15 3v4" />
    </svg>
  );
}

function MedalIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="10" r="4" />
      <path d="M9.5 13.5 8 21l4-2 4 2-1.5-7.5" />
    </svg>
  );
}

function TargetIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function LeafIcon({ className = "" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14-1 0-2-.9-2-2Z" />
      <path d="M8 16c2-3 4-5 7-6" />
    </svg>
  );
}

// Ключ (хранится в БД) -> компонент иконки + человекочитаемое имя.
export const ICON_MAP: Record<string, { comp: IconComp; label: string }> = {
  // существующие из icons.tsx
  team: { comp: TeamIcon, label: "Команда" },
  method: { comp: MethodIcon, label: "Методики" },
  academic: { comp: AcademicIcon, label: "Академия" },
  practice: { comp: PracticeIcon, label: "Практика" },
  tooth: { comp: ToothIcon, label: "Зуб" },
  implant: { comp: ImplantIcon, label: "Имплант" },
  ortho: { comp: OrthoIcon, label: "Ортодонтия" },
  gnathology: { comp: GnathologyIcon, label: "Гнатология" },
  // новые кастомные
  shield: { comp: ShieldIcon, label: "Защита" },
  heart: { comp: HeartIcon, label: "Забота" },
  star: { comp: StarIcon, label: "Качество" },
  clock: { comp: ClockIcon, label: "Скорость" },
  microscope: { comp: MicroscopeIcon, label: "Диагностика" },
  sparkle: { comp: SparkleIcon, label: "Эстетика" },
  check: { comp: CheckIcon, label: "Гарантия" },
  chat: { comp: ChatIcon, label: "Консультация" },
  calendar: { comp: CalendarIcon, label: "Запись" },
  medal: { comp: MedalIcon, label: "Экспертиза" },
  target: { comp: TargetIcon, label: "Точность" },
  leaf: { comp: LeafIcon, label: "Бережно" },
};

export const ICON_KEYS = Object.keys(ICON_MAP);

export function getIcon(key: string): IconComp {
  return ICON_MAP[key]?.comp ?? TeamIcon;
}