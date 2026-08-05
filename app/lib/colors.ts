import type { HabitColor } from "./habits";

/**
 * Tailwind scans source files for complete class names, so every shade has to
 * appear literally here — building them as `bg-${color}-500` would produce
 * classes that never make it into the stylesheet.
 */
const EMPTY_CELL = "bg-zinc-200/70 dark:bg-zinc-800";

const CELL_SHADES: Record<HabitColor, [string, string, string, string]> = {
  green: [
    "bg-green-200 dark:bg-green-950",
    "bg-green-300 dark:bg-green-800",
    "bg-green-400 dark:bg-green-600",
    "bg-green-600 dark:bg-green-400",
  ],
  blue: [
    "bg-blue-200 dark:bg-blue-950",
    "bg-blue-300 dark:bg-blue-800",
    "bg-blue-400 dark:bg-blue-600",
    "bg-blue-600 dark:bg-blue-400",
  ],
  purple: [
    "bg-purple-200 dark:bg-purple-950",
    "bg-purple-300 dark:bg-purple-800",
    "bg-purple-400 dark:bg-purple-600",
    "bg-purple-600 dark:bg-purple-400",
  ],
  amber: [
    "bg-amber-200 dark:bg-amber-950",
    "bg-amber-300 dark:bg-amber-800",
    "bg-amber-400 dark:bg-amber-600",
    "bg-amber-500 dark:bg-amber-400",
  ],
  rose: [
    "bg-rose-200 dark:bg-rose-950",
    "bg-rose-300 dark:bg-rose-800",
    "bg-rose-400 dark:bg-rose-600",
    "bg-rose-600 dark:bg-rose-400",
  ],
};

export function cellClass(color: HabitColor, level: 0 | 1 | 2 | 3 | 4): string {
  return level === 0 ? EMPTY_CELL : CELL_SHADES[color][level - 1];
}

/** Solid swatch used for the habit's dot and the color picker. */
export const SWATCH_CLASS: Record<HabitColor, string> = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export const COLOR_LABEL: Record<HabitColor, string> = {
  green: "グリーン",
  blue: "ブルー",
  purple: "パープル",
  amber: "アンバー",
  rose: "ローズ",
};
