"use client";

import AddHabitForm from "./AddHabitForm";
import HabitGrid from "./HabitGrid";
import HabitRow from "./HabitRow";
import { formatDateKey, startOfDay, toDateKey, type DateKey } from "@/app/lib/date";
import { updateHabits, useHabits, useIsHydrated } from "@/app/lib/habitStore";
import {
  HABIT_COLORS,
  completedCount,
  createHabit,
  intensityLevel,
  isDone,
  toggleDate,
  type Habit,
  type HabitColor,
} from "@/app/lib/habits";
import { useCallback, useMemo, useState } from "react";

const ALL = "__all__";

export default function HabitApp() {
  const habits = useHabits();
  const [selectedId, setSelectedId] = useState<string>(ALL);

  // `today` depends on the visitor's clock and time zone, so it stays null
  // until hydration finishes rather than risking a server/client mismatch.
  const isHydrated = useIsHydrated();
  const today = useMemo(() => (isHydrated ? startOfDay(new Date()) : null), [isHydrated]);

  const selected = habits.find((habit) => habit.id === selectedId) ?? null;

  const handleAdd = useCallback(
    (name: string, color: HabitColor) => {
      if (!today) return;
      updateHabits((current) => [...current, createHabit(name, color, today)]);
    },
    [today],
  );

  const handleToggle = useCallback((habitId: string, key: DateKey) => {
    updateHabits((current) =>
      current.map((habit) => (habit.id === habitId ? toggleDate(habit, key) : habit)),
    );
  }, []);

  const handleDelete = useCallback((habit: Habit) => {
    if (!window.confirm(`「${habit.name}」を削除しますか？記録も消えます。`)) return;
    updateHabits((current) => current.filter((item) => item.id !== habit.id));
    setSelectedId((current) => (current === habit.id ? ALL : current));
  }, []);

  const levelFor = useCallback(
    (key: DateKey): 0 | 1 | 2 | 3 | 4 => {
      if (selected) return isDone(selected, key) ? 4 : 0;
      return intensityLevel(completedCount(habits, key), habits.length);
    },
    [habits, selected],
  );

  const labelFor = useCallback(
    (key: DateKey): string => {
      if (selected) {
        return `${formatDateKey(key)} — ${isDone(selected, key) ? "達成" : "未達成"}`;
      }
      return `${formatDateKey(key)} — ${completedCount(habits, key)}/${habits.length} 達成`;
    },
    [habits, selected],
  );

  const doneToday = useMemo(() => {
    if (!today) return 0;
    return completedCount(habits, toDateKey(today));
  }, [habits, today]);

  const suggestedColor = HABIT_COLORS[habits.length % HABIT_COLORS.length];

  if (!today) {
    return (
      <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" aria-hidden />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <TabButton
              label="すべて"
              isActive={selectedId === ALL}
              onClick={() => setSelectedId(ALL)}
            />
            {habits.map((habit) => (
              <TabButton
                key={habit.id}
                label={habit.name}
                isActive={habit.id === selectedId}
                onClick={() => setSelectedId(habit.id)}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selected ? "セルをクリックで記録を編集" : `今日 ${doneToday}/${habits.length} 達成`}
          </p>
        </div>

        <HabitGrid
          today={today}
          color={selected?.color ?? "green"}
          levelFor={levelFor}
          labelFor={labelFor}
          onToggle={selected ? (key) => handleToggle(selected.id, key) : undefined}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">習慣</h2>

        {habits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            まだ習慣がありません。下のフォームから追加してください。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                today={today}
                isSelected={habit.id === selectedId}
                onSelect={() => setSelectedId(habit.id)}
                onToggleToday={() => handleToggle(habit.id, toDateKey(today))}
                onDelete={() => handleDelete(habit)}
              />
            ))}
          </ul>
        )}

        <AddHabitForm onAdd={handleAdd} suggestedColor={suggestedColor} />
      </section>
    </div>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`max-w-40 truncate rounded-full px-3 py-1 text-xs font-medium transition ${
        isActive
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}
