import { toDateKey, type DateKey } from "./date";
import { completionRate, currentStreak, longestStreak, type Habit } from "./habits";

/** Aggregated per-habit stats. Deliberately excludes the raw `dates` array. */
export type HabitStat = {
  name: string;
  currentStreak: number;
  longestStreak: number;
  /** Completion rate over the trailing 30 days (or the habit's whole life if younger), 0–100. */
  last30DayPercent: number;
};

export type InsightPayload = {
  today: DateKey;
  habits: HabitStat[];
};

/**
 * Builds the data sent to the AI summary endpoint. Only aggregated numbers —
 * never the raw `dates` array — leave the browser, so a single day's
 * check-in can never be reconstructed server-side from this payload.
 */
export function buildInsightPayload(habits: Habit[], today: Date): InsightPayload {
  return {
    today: toDateKey(today),
    habits: habits.map((habit) => ({
      name: habit.name,
      currentStreak: currentStreak(habit, today),
      longestStreak: longestStreak(habit),
      last30DayPercent: Math.round(completionRate(habit, today, 30) * 100),
    })),
  };
}
