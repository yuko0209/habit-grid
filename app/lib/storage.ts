import { HABIT_COLORS, type Habit, type HabitColor } from "./habits";

const STORAGE_KEY = "habit-grid:v1";

type StoredState = {
  version: 1;
  habits: Habit[];
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isHabitColor(value: unknown): value is HabitColor {
  return HABIT_COLORS.includes(value as HabitColor);
}

/**
 * localStorage is user-editable and may hold data from an older build, so
 * anything that doesn't match the shape we expect is dropped rather than
 * trusted into React state.
 */
function parseHabit(value: unknown): Habit | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;

  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  if (typeof raw.createdAt !== "string" || !DATE_KEY_PATTERN.test(raw.createdAt)) return null;
  if (!Array.isArray(raw.dates)) return null;

  const dates = raw.dates.filter(
    (date): date is string => typeof date === "string" && DATE_KEY_PATTERN.test(date),
  );

  return {
    id: raw.id,
    name: raw.name,
    color: isHabitColor(raw.color) ? raw.color : "green",
    createdAt: raw.createdAt,
    dates: [...new Set(dates)].sort(),
  };
}

/**
 * Reads a `{ version, habits }` payload, from storage or from an imported
 * file. Returns null when the payload isn't recognizable at all, so callers
 * can tell "not our data" apart from "no habits yet".
 */
export function parseState(value: unknown): Habit[] | null {
  if (typeof value !== "object" || value === null) return null;

  const habits = (value as Partial<StoredState>).habits;
  if (!Array.isArray(habits)) return null;

  return habits.map(parseHabit).filter((habit): habit is Habit => habit !== null);
}

export function serializeState(habits: Habit[]): string {
  const state: StoredState = { version: 1, habits };
  return JSON.stringify(state, null, 2);
}

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    return parseState(JSON.parse(raw)) ?? [];
  } catch {
    // Corrupt or unreadable storage (private mode, quota, bad JSON): start empty.
    return [];
  }
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, habits }));
  } catch {
    // Storage unavailable or full — the in-memory state stays usable.
  }
}
