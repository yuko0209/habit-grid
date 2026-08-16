"use client";

import { useCallback, useState } from "react";
import { toDateKey } from "@/app/lib/date";
import type { Habit } from "@/app/lib/habits";
import { buildInsightPayload } from "@/app/lib/insight";

const STORAGE_PREFIX = "habit-grid:insight:";

type Status = "idle" | "loading" | "error";

function readCached(key: string): string | null {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function writeCached(key: string, text: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, text);
  } catch {
    // Storage full or unavailable — the comment simply isn't cached.
  }
}

export default function AIInsight({ habits, today }: { habits: Habit[]; today: Date }) {
  const dateKey = toDateKey(today);
  const [text, setText] = useState<string | null>(() => readCached(dateKey));
  const [status, setStatus] = useState<Status>("idle");

  const handleFetch = useCallback(async () => {
    setStatus("loading");
    try {
      const payload = buildInsightPayload(habits, today);
      const response = await fetch("/api/insight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || typeof data.text !== "string") {
        throw new Error(data.error ?? "failed");
      }
      setText(data.text);
      writeCached(dateKey, data.text);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [habits, today, dateKey]);

  if (habits.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">今日のひとこと</h2>
        <button
          type="button"
          onClick={handleFetch}
          disabled={status === "loading"}
          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {status === "loading" ? "生成中…" : text ? "もう一度もらう" : "AIにもらう"}
        </button>
      </div>

      {text && <p className="text-sm text-zinc-700 dark:text-zinc-300">{text}</p>}
      {status === "error" && (
        <p className="text-xs text-rose-500">取得に失敗しました。しばらくして試してください。</p>
      )}
      {!text && status !== "error" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          継続日数と達成率（習慣名・数値のみ、日付ごとの記録は送りません）をAIに送って、短いコメントをもらいます。
        </p>
      )}
    </section>
  );
}
