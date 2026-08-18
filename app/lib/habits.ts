import {
  addDays,
  daysBetween,
  fromDateKey,
  toDateKey,
  type DateKey,
} from "./date";

export const HABIT_COLORS = [
  "green",
  "blue",
  "purple",
  "amber",
  "rose",
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

export type Habit = {
  id: string;
  name: string;
  color: HabitColor;
  createdAt: DateKey;
  /** Completed days, ascending. */
  dates: DateKey[];
};

/**
 * `crypto.randomUUID` only exists in secure contexts, so it is missing when the
 * app is opened over plain http — e.g. `http://192.168.x.x:3000` while checking
 * the layout on a phone. The fallback adds randomness because a timestamp alone
 * collides for two habits added in the same millisecond.
 */
function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createHabit(
  name: string,
  color: HabitColor,
  today: Date,
): Habit {
  return {
    id: createId(),
    name: name.trim(),
    color,
    createdAt: toDateKey(today),
    dates: [],
  };
}

export function isDone(habit: Habit, key: DateKey): boolean {
  return habit.dates.includes(key);
}

/** Returns a new habit with `key` flipped between done and not done. */
export function toggleDate(habit: Habit, key: DateKey): Habit {
  const dates = isDone(habit, key)
    ? habit.dates.filter((date) => date !== key)
    : [...habit.dates, key].sort();
  return { ...habit, dates };
}

/**
 * Days completed in an unbroken run ending today. A habit not yet checked
 * today still counts its run through yesterday — the day isn't over.
 */
export function currentStreak(habit: Habit, today: Date): number {
  const done = new Set(habit.dates);
  let cursor = done.has(toDateKey(today)) ? today : addDays(today, -1);

  let streak = 0;
  while (done.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(habit: Habit): number {
  if (habit.dates.length === 0) return 0;

  const sorted = [...habit.dates].sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const gap = daysBetween(fromDateKey(sorted[i - 1]), fromDateKey(sorted[i]));
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

/**
 * How many days the rate is measured over: `days`, or the habit's whole life
 * if it is younger than that. Without this, a habit created yesterday and
 * completed both days would read 7% instead of 100%.
 */
export function completionWindow(
  habit: Habit,
  today: Date,
  days: number,
): number {
  const age = daysBetween(fromDateKey(habit.createdAt), today) + 1;
  return Math.max(1, Math.min(days, age));
}

/** Share of the trailing window (ending today) that was completed, 0–1. */
export function completionRate(
  habit: Habit,
  today: Date,
  days: number,
): number {
  const window = completionWindow(habit, today, days);
  const done = new Set(habit.dates);

  let hits = 0;
  for (let i = 0; i < window; i += 1) {
    if (done.has(toDateKey(addDays(today, -i)))) hits += 1;
  }
  return hits / window;
}

/**
 * Heatmap intensity for a day, as a level from 0 (none) to 4 (all habits).
 * With a single habit selected this collapses to "empty or full".
 */
export function intensityLevel(
  completed: number,
  total: number,
): 0 | 1 | 2 | 3 | 4 {
  if (total === 0 || completed === 0) return 0;
  if (completed >= total) return 4;
  const ratio = completed / total;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.33) return 2;
  return 1;
}

/** How many of `habits` were completed on the given day. */
export function completedCount(habits: Habit[], key: DateKey): number {
  return habits.reduce(
    (count, habit) => (isDone(habit, key) ? count + 1 : count),
    0,
  );
}

/** Updates a habit's name and color. */
export function editHabit(habit: Habit, name: string, color: HabitColor): Habit {
  return {
    ...habit,
    name: name.trim(),
    color,
  };
}

/** Moves a habit at `index` up or down in the array. */
export function reorderHabits(habits: Habit[], index: number, direction: "up" | "down"): Habit[] {
  if (direction === "up" && index === 0) return habits;
  if (direction === "down" && index === habits.length - 1) return habits;
  const next = [...habits];
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  const [temp] = next.splice(index, 1);
  next.splice(targetIndex, 0, temp);
  return next;
}
