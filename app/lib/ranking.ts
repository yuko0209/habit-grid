import { fromDateKey, monthPeriod, type Period } from "./date";
import { currentStreak, type Habit } from "./habits";

/**
 * Ranking is derived from the habits already in storage — nothing new is
 * persisted, so there is no migration and the backup format is unchanged.
 *
 * Storing a monthly snapshot was the alternative, and it would go stale: the
 * grid lets a past day be edited at any time, so a saved rank stops matching
 * the records it came from. Recomputing also means last month's ranking is
 * available immediately, rather than only for months recorded after shipping.
 */

export const RANKING_METRICS = ["done", "streak"] as const;

export type RankingMetric = (typeof RANKING_METRICS)[number];

export const METRIC_LABEL: Record<RankingMetric, string> = {
  done: "達成",
  streak: "継続",
};

/** How a habit's rank moved against the same ranking a month earlier. */
export type RankDelta =
  | { kind: "new" }
  | { kind: "same" }
  | { kind: "up"; places: number }
  | { kind: "down"; places: number };

export type RankedHabit = {
  habit: Habit;
  /** Ties share a rank and consume the slots after it: 1, 2, 2, 4. */
  rank: number;
  /** True when at least one other habit holds the same rank. */
  isTied: boolean;
  value: number;
  /** Value against the length of the period, 0–1. */
  share: number;
  percent: number;
  delta: RankDelta;
};

/** Days completed inside the period. */
export function countInPeriod(habit: Habit, period: Period): number {
  // DateKey is `YYYY-MM-DD`, so string order is chronological order.
  return habit.dates.filter((date) => date >= period.start && date <= period.end).length;
}

function measure(habit: Habit, period: Period, metric: RankingMetric): number {
  if (metric === "streak") {
    // The run as it stood at the end of the period, so past months are
    // measured the same way the current one is.
    return currentStreak(habit, fromDateKey(period.end));
  }
  return countInPeriod(habit, period);
}

type Placed = {
  habit: Habit;
  value: number;
  rank: number;
};

function place(habits: Habit[], period: Period, metric: RankingMetric): Placed[] {
  const sorted = habits
    .map((habit) => ({ habit, value: measure(habit, period, metric) }))
    // Name breaks ties so the order stays put when the metric is toggled.
    .sort((a, b) => b.value - a.value || a.habit.name.localeCompare(b.habit.name, "ja"));

  let rank = 0;
  let previous: number | null = null;

  return sorted.map((entry, index) => {
    if (previous === null || entry.value !== previous) {
      rank = index + 1;
      previous = entry.value;
    }
    return { habit: entry.habit, value: entry.value, rank };
  });
}

/** Whether the habit already existed by the end of the period. */
function existedIn(habit: Habit, period: Period): boolean {
  return habit.createdAt <= period.end;
}

function toDelta(current: number, previous: number | undefined): RankDelta {
  if (previous === undefined) return { kind: "new" };
  if (previous === current) return { kind: "same" };
  return previous > current
    ? { kind: "up", places: previous - current }
    : { kind: "down", places: current - previous };
}

/**
 * Ranks habits over `period`, marking how each one moved since `comparedTo`.
 * Without a comparison period every habit reads as new.
 */
export function rankHabits(
  habits: Habit[],
  period: Period,
  metric: RankingMetric,
  comparedTo?: Period,
): RankedHabit[] {
  const placed = place(habits, period, metric);

  const countsByRank = new Map<number, number>();
  for (const entry of placed) {
    countsByRank.set(entry.rank, (countsByRank.get(entry.rank) ?? 0) + 1);
  }

  const previousRanks = new Map<string, number>();
  if (comparedTo) {
    // Only habits that existed then had a position to move from.
    const existing = habits.filter((habit) => existedIn(habit, comparedTo));
    for (const entry of place(existing, comparedTo, metric)) {
      previousRanks.set(entry.habit.id, entry.rank);
    }
  }

  return placed.map((entry) => ({
    habit: entry.habit,
    rank: entry.rank,
    isTied: (countsByRank.get(entry.rank) ?? 0) > 1,
    value: entry.value,
    share: Math.min(1, entry.value / period.days),
    percent: Math.round(Math.min(1, entry.value / period.days) * 100),
    delta: toDelta(entry.rank, previousRanks.get(entry.habit.id)),
  }));
}

/** This month's ranking, compared against last month's. */
export function rankThisMonth(
  habits: Habit[],
  today: Date,
  metric: RankingMetric,
): { period: Period; ranked: RankedHabit[] } {
  const period = monthPeriod(today, 0);
  return {
    period,
    ranked: rankHabits(habits, period, metric, monthPeriod(today, -1)),
  };
}
