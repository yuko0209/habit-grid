"use client";

import { COLOR_LABEL, SWATCH_CLASS } from "@/app/lib/colors";
import { HABIT_COLORS, type HabitColor } from "@/app/lib/habits";
import { useState, type FormEvent } from "react";

type Props = {
  onAdd: (name: string, color: HabitColor) => void;
  /** Used to pre-select a color that isn't already in heavy rotation. */
  suggestedColor: HabitColor;
};

export default function AddHabitForm({ onAdd, suggestedColor }: Props) {
  const [name, setName] = useState("");
  // Null means "follow the suggestion", so colors rotate as habits are added
  // until the user picks one deliberately.
  const [picked, setPicked] = useState<HabitColor | null>(null);
  const color = picked ?? suggestedColor;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name, color);
    setName("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="新しい習慣（例: 30分読書）"
        maxLength={40}
        className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500"
      />

      <div className="flex items-center gap-1.5">
        {HABIT_COLORS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPicked(option)}
            title={COLOR_LABEL[option]}
            aria-label={COLOR_LABEL[option]}
            aria-pressed={color === option}
            className={`h-6 w-6 rounded-full transition ${SWATCH_CLASS[option]} ${
              color === option
                ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-white dark:ring-zinc-100 dark:ring-offset-zinc-900"
                : "opacity-60 hover:opacity-100"
            }`}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-zinc-300"
      >
        追加
      </button>
    </form>
  );
}
