"use client";

import { buildGrid, monthLabels, toDateKey, type DateKey } from "@/app/lib/date";
import { cellClass } from "@/app/lib/colors";
import type { HabitColor } from "@/app/lib/habits";
import { useMemo } from "react";

/**
 * Roughly half a year. Wide enough to show a habit taking hold, and still
 * legible on a phone without the grid scrolling by default.
 */
export const GRID_WEEKS = 27;

/** Only Mon/Wed/Fri are labelled, as in GitHub's contribution graph. */
const WEEKDAY_LABELS = ["", "月", "", "水", "", "金", ""];

type Props = {
  today: Date;
  color: HabitColor;
  /** Intensity 0–4 for a given day. */
  levelFor: (key: DateKey) => 0 | 1 | 2 | 3 | 4;
  /** Tooltip text for a given day. */
  labelFor: (key: DateKey) => string;
  /** Omitted when the grid is read-only (e.g. the "all habits" overview). */
  onToggle?: (key: DateKey) => void;
};

export default function HabitGrid({ today, color, levelFor, labelFor, onToggle }: Props) {
  const grid = useMemo(() => buildGrid(today, GRID_WEEKS), [today]);
  const months = useMemo(() => monthLabels(grid), [grid]);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[3px] pl-7">
          {months.map((month, index) => (
            <div
              key={index}
              className="w-3 shrink-0 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400"
            >
              {month}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          <div className="flex w-6 shrink-0 flex-col gap-[3px] pr-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={index}
                className="h-3 text-right text-[10px] leading-3 text-zinc-500 dark:text-zinc-400"
              >
                {label}
              </div>
            ))}
          </div>

          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((cell) =>
                cell.isFuture ? (
                  <div key={cell.key} className="h-3 w-3" />
                ) : onToggle ? (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => onToggle(cell.key)}
                    title={labelFor(cell.key)}
                    aria-label={labelFor(cell.key)}
                    className={`h-3 w-3 rounded-[2px] transition hover:ring-2 hover:ring-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${cellClass(
                      color,
                      levelFor(cell.key),
                    )} ${cell.key === todayKey ? "ring-1 ring-zinc-400 dark:ring-zinc-500" : ""}`}
                  />
                ) : (
                  <div
                    key={cell.key}
                    title={labelFor(cell.key)}
                    className={`h-3 w-3 rounded-[2px] ${cellClass(color, levelFor(cell.key))}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 pl-7 pt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span>少</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <div key={level} className={`h-3 w-3 rounded-[2px] ${cellClass(color, level)}`} />
          ))}
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
