import {
  completedCount,
  completionRate,
  completionWindow,
  createHabit,
  currentStreak,
  intensityLevel,
  isDone,
  longestStreak,
  toggleDate,
  type Habit,
} from "./habits";
import { describe, expect, it } from "vitest";

const TODAY = new Date(2026, 7, 5);

function habit(dates: string[], overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "読書",
    color: "green",
    createdAt: "2026-07-01",
    dates,
    ...overrides,
  };
}

describe("createHabit", () => {
  it("trims the name and starts with no records", () => {
    const created = createHabit("  朝ラン  ", "blue", TODAY);

    expect(created.name).toBe("朝ラン");
    expect(created.color).toBe("blue");
    expect(created.createdAt).toBe("2026-08-05");
    expect(created.dates).toEqual([]);
  });
});

describe("toggleDate", () => {
  it("adds a missing date and keeps the list sorted", () => {
    const result = toggleDate(habit(["2026-08-01", "2026-08-05"]), "2026-08-03");

    expect(result.dates).toEqual(["2026-08-01", "2026-08-03", "2026-08-05"]);
  });

  it("removes a date that is already recorded", () => {
    const result = toggleDate(habit(["2026-08-01", "2026-08-03"]), "2026-08-03");

    expect(result.dates).toEqual(["2026-08-01"]);
  });

  it("does not mutate the original habit", () => {
    const original = habit(["2026-08-01"]);
    toggleDate(original, "2026-08-02");

    expect(original.dates).toEqual(["2026-08-01"]);
  });
});

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    const streak = currentStreak(habit(["2026-08-03", "2026-08-04", "2026-08-05"]), TODAY);

    expect(streak).toBe(3);
  });

  it("keeps the streak alive when today is not checked yet", () => {
    const streak = currentStreak(habit(["2026-08-03", "2026-08-04"]), TODAY);

    expect(streak).toBe(2);
  });

  it("is zero once yesterday is missed too", () => {
    expect(currentStreak(habit(["2026-08-01", "2026-08-02"]), TODAY)).toBe(0);
  });

  it("is zero for a habit with no records", () => {
    expect(currentStreak(habit([]), TODAY)).toBe(0);
  });

  it("counts a run that starts today", () => {
    expect(currentStreak(habit(["2026-08-05"]), TODAY)).toBe(1);
  });
});

describe("longestStreak", () => {
  it("finds the longest run across gaps", () => {
    const dates = ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-10", "2026-07-11"];

    expect(longestStreak(habit(dates))).toBe(3);
  });

  it("handles unsorted input", () => {
    expect(longestStreak(habit(["2026-07-03", "2026-07-01", "2026-07-02"]))).toBe(3);
  });

  it("spans a month boundary", () => {
    expect(longestStreak(habit(["2026-07-30", "2026-07-31", "2026-08-01"]))).toBe(3);
  });

  it("is zero with no records and one for a single day", () => {
    expect(longestStreak(habit([]))).toBe(0);
    expect(longestStreak(habit(["2026-07-04"]))).toBe(1);
  });
});

describe("completionWindow", () => {
  it("is the full window for a habit older than it", () => {
    expect(completionWindow(habit([]), TODAY, 30)).toBe(30);
  });

  it("shrinks to the habit's age while it is younger", () => {
    // Created 2026-08-03, today 2026-08-05 → the habit has existed 3 days.
    expect(completionWindow(habit([], { createdAt: "2026-08-03" }), TODAY, 30)).toBe(3);
  });

  it("is never zero, even on the day the habit is created", () => {
    expect(completionWindow(habit([], { createdAt: "2026-08-05" }), TODAY, 30)).toBe(1);
  });
});

describe("completionRate", () => {
  it("is the share of the trailing window that was completed", () => {
    const dates = ["2026-08-05", "2026-08-04", "2026-08-03", "2026-08-02", "2026-08-01"];

    expect(completionRate(habit(dates), TODAY, 10)).toBe(0.5);
  });

  it("ignores days outside the window", () => {
    expect(completionRate(habit(["2026-01-01"]), TODAY, 30)).toBe(0);
  });

  it("does not punish a habit for days before it existed", () => {
    // Created two days ago and completed on both days plus today: 3/3, not 3/30.
    const young = habit(["2026-08-03", "2026-08-04", "2026-08-05"], {
      createdAt: "2026-08-03",
    });

    expect(completionRate(young, TODAY, 30)).toBe(1);
  });

  it("still counts missed days within a young habit's life", () => {
    const young = habit(["2026-08-05"], { createdAt: "2026-08-03" });

    expect(completionRate(young, TODAY, 30)).toBeCloseTo(1 / 3);
  });
});

describe("intensityLevel", () => {
  it("is 0 with nothing done and 4 when everything is done", () => {
    expect(intensityLevel(0, 3)).toBe(0);
    expect(intensityLevel(3, 3)).toBe(4);
  });

  it("scales partial completion between 1 and 3", () => {
    expect(intensityLevel(1, 4)).toBe(1);
    expect(intensityLevel(2, 4)).toBe(2);
    expect(intensityLevel(3, 4)).toBe(3);
  });

  it("is 0 when there are no habits at all", () => {
    expect(intensityLevel(0, 0)).toBe(0);
  });
});

describe("completedCount", () => {
  it("counts how many habits were done on a day", () => {
    const habits = [
      habit(["2026-08-05"], { id: "a" }),
      habit(["2026-08-04"], { id: "b" }),
      habit(["2026-08-05"], { id: "c" }),
    ];

    expect(completedCount(habits, "2026-08-05")).toBe(2);
  });
});

describe("isDone", () => {
  it("reports whether a specific day is recorded", () => {
    expect(isDone(habit(["2026-08-05"]), "2026-08-05")).toBe(true);
    expect(isDone(habit(["2026-08-05"]), "2026-08-04")).toBe(false);
  });
});
