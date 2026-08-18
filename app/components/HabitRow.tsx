"use client";

import { useState } from "react";
import { SWATCH_CLASS } from "@/app/lib/colors";
import { toDateKey } from "@/app/lib/date";
import {
  completionRate,
  completionWindow,
  currentStreak,
  isDone,
  longestStreak,
  HABIT_COLORS,
  type Habit,
  type HabitColor,
} from "@/app/lib/habits";

type Props = {
  habit: Habit;
  today: Date;
  isSelected: boolean;
  onSelect: () => void;
  onToggleToday: () => void;
  onDelete: () => void;
  onEdit: (name: string, color: HabitColor) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export default function HabitRow({
  habit,
  today,
  isSelected,
  onSelect,
  onToggleToday,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [editedColor, setEditedColor] = useState<HabitColor>(habit.color);

  const doneToday = isDone(habit, toDateKey(today));
  const streak = currentStreak(habit, today);
  const best = longestStreak(habit);
  // Young habits are measured over their whole life, so the label has to say
  // which window the percentage actually refers to.
  const window = completionWindow(habit, today, 30);
  const rate = Math.round(completionRate(habit, today, 30) * 100);

  if (isEditing) {
    return (
      <li className="flex flex-col gap-3 rounded-xl border border-zinc-400 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-900">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="習慣名"
            maxLength={60}
            required
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditedColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition ${SWATCH_CLASS[c]} ${
                  editedColor === c
                    ? "border-zinc-900 scale-110 dark:border-zinc-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`${c}を選択`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditedName(habit.name);
                setEditedColor(habit.color);
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => {
                if (editedName.trim()) {
                  onEdit(editedName, editedColor);
                  setIsEditing(false);
                }
              }}
              disabled={!editedName.trim()}
              className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              保存
            </button>
          </div>
        </div>
      </li>
    );
  }

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
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${SWATCH_CLASS[habit.color]}`}
          />
          <span className="truncate text-sm font-medium">{habit.name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>🔥 継続 {streak}日</span>
          <span>最長 {best}日</span>
          <span>合計 {habit.dates.length}日</span>
          <span>
            直近{window}日 {rate}%
          </span>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label="上に移動"
          className="rounded-lg p-1 text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-20 disabled:hover:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label="下に移動"
          className="rounded-lg p-1 text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-20 disabled:hover:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => {
            setEditedName(habit.name);
            setEditedColor(habit.color);
            setIsEditing(true);
          }}
          className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          編集
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${habit.name} を削除`}
          className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          削除
        </button>
      </div>
    </li>
  );
}
