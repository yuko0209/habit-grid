"use client";

import { downloadBackup, readBackup } from "@/app/lib/backup";
import { replaceHabits } from "@/app/lib/habitStore";
import type { Habit } from "@/app/lib/habits";
import { useRef, useState, type ChangeEvent } from "react";

type Props = {
  habits: Habit[];
  today: Date;
};

export default function BackupControls({ habits, today }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clearing the value lets the same file be picked again after an error.
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await readBackup(file);
      const confirmed = window.confirm(
        `${imported.length}件の習慣を読み込みます。現在の記録は置き換えられます。よろしいですか？`,
      );
      if (!confirmed) return;

      replaceHabits(imported);
      setMessage({ text: `${imported.length}件の習慣を読み込みました。`, isError: false });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "読み込みに失敗しました。",
        isError: true,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          downloadBackup(habits, today);
          setMessage({ text: "バックアップを書き出しました。", isError: false });
        }}
        disabled={habits.length === 0}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition enabled:hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:enabled:hover:bg-zinc-800"
      >
        エクスポート
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        インポート
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
        aria-label="バックアップファイルを選択"
      />

      {message && (
        <p
          role="status"
          className={`text-xs ${
            message.isError ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
