"use client";

import { SWATCH_CLASS } from "@/app/lib/colors";
import { toDateKey } from "@/app/lib/date";
import { completionRate, currentStreak, isDone, longestStreak, type Habit } from "@/app/lib/habits";

type Props = {
  habit: Habit;
  today: Date;
  isSelected: boolean;
  onSelect: () => void;
  onToggleToday: () => void;
  onDelete: () => void;
};

export default function HabitRow({
  habit,
  today,
  isSelected,
  onSelect,
  onToggleToday,
  onDelete,
}: Props) {
  const doneToday = isDone(habit, toDateKey(today));
  const streak = currentStreak(habit, today);
  const best = longestStreak(habit);
  const rate = Math.round(completionRate(habit, today, 30) * 100);

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
        isSelected
          ? "border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
      }`}
    >
      <button
        type="button"
        onClick={onToggleToday}
        aria-pressed={doneToday}
        aria-label={`${habit.name} を今日${doneToday ? "未達成に戻す" : "達成にする"}`}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm transition ${
          doneToday
            ? `border-transparent text-white ${SWATCH_CLASS[habit.color]}`
            : "border-zinc-300 text-transparent hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
        }`}
      >
        ✓
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
        aria-label={`${habit.name} のグリッドを表示`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${SWATCH_CLASS[habit.color]}`} />
          <span className="truncate text-sm font-medium">{habit.name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>🔥 継続 {streak}日</span>
          <span>最長 {best}日</span>
          <span>合計 {habit.dates.length}日</span>
          <span>直近30日 {rate}%</span>
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`${habit.name} を削除`}
        className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        削除
      </button>
    </li>
  );
}
