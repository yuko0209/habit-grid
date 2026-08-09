"use client";

import { SWATCH_CLASS } from "@/app/lib/colors";
import type { Habit } from "@/app/lib/habits";
import {
  METRIC_LABEL,
  RANKING_METRICS,
  rankThisMonth,
  type RankDelta,
  type RankingMetric,
} from "@/app/lib/ranking";
import { useMemo, useState } from "react";

type Props = {
  habits: Habit[];
  today: Date;
};

export default function HabitRanking({ habits, today }: Props) {
  const [metric, setMetric] = useState<RankingMetric>("done");
  const { period, ranked } = useMemo(
    () => rankThisMonth(habits, today, metric),
    [habits, today, metric],
  );

  // A ranking of one is not a ranking.
  if (habits.length < 2) return null;

  const hint =
    metric === "done"
      ? `${period.label}に達成した日数。バーは経過${period.days}日に対する割合です。`
      : `今つながっている連続日数。バーは経過${period.days}日に対する割合です。`;

  return (
    <section className="flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          ランキング
          <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
            {period.label}・{period.days}日経過
          </span>
        </h2>

        <div className="flex gap-1.5" role="group" aria-label="ランキングの基準">
          {RANKING_METRICS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMetric(option)}
              aria-pressed={option === metric}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                option === metric
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {METRIC_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>

      <ol className="flex flex-col gap-2" aria-label={`ランキング（${METRIC_LABEL[metric]}）`}>
        {ranked.map((entry) => (
          <li
            key={entry.habit.id}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums text-white ${
                  SWATCH_CLASS[entry.habit.color]
                }`}
                aria-hidden
              >
                {entry.rank}
              </span>

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {entry.habit.name}
                <span className="sr-only">
                  {entry.isTied ? `同率${entry.rank}位` : `${entry.rank}位`}
                </span>
                {entry.isTied && (
                  <span
                    className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 align-middle text-[10px] font-normal text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    aria-hidden
                  >
                    同率
                  </span>
                )}
              </span>

              <span className="shrink-0 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                {metric === "done" ? `${entry.value} / ${period.days}日` : `${entry.value}日`}
              </span>

              <DeltaLabel delta={entry.delta} />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-[width] ${SWATCH_CLASS[entry.habit.color]}`}
                  style={{ width: `${entry.percent}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {entry.percent}%
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Arrows are decorative; the movement is spelled out for screen readers. */
function DeltaLabel({ delta }: { delta: RankDelta }) {
  const { text, description, className } = describe(delta);

  return (
    <span className={`w-10 shrink-0 text-right text-xs tabular-nums ${className}`}>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{description}</span>
    </span>
  );
}

function describe(delta: RankDelta): {
  text: string;
  description: string;
  className: string;
} {
  switch (delta.kind) {
    case "new":
      return {
        text: "NEW",
        description: "今月から",
        className: "text-zinc-400 dark:text-zinc-500",
      };
    case "up":
      return {
        text: `↑${delta.places}`,
        description: `先月より${delta.places}つ上昇`,
        className: "text-green-600 dark:text-green-400",
      };
    case "down":
      return {
        text: `↓${delta.places}`,
        description: `先月より${delta.places}つ下降`,
        className: "text-red-600 dark:text-red-400",
      };
    case "same":
      return {
        text: "─",
        description: "先月と同じ",
        className: "text-zinc-400 dark:text-zinc-500",
      };
  }
}
