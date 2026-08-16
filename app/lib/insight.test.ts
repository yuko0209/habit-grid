import { buildInsightPayload } from "./insight";
import type { Habit } from "./habits";
import { describe, expect, it } from "vitest";

const TODAY = new Date(2026, 7, 15);

function habit(dates: string[]): Habit {
  return {
    id: "h1",
    name: "読書",
    color: "green",
    createdAt: "2026-07-01",
    dates,
  };
}

describe("buildInsightPayload", () => {
  it("summarizes each habit into aggregated numbers", () => {
    const payload = buildInsightPayload(
      [habit(["2026-08-13", "2026-08-14", "2026-08-15"])],
      TODAY,
    );

    expect(payload.today).toBe("2026-08-15");
    expect(payload.habits).toEqual([
      { name: "読書", currentStreak: 3, longestStreak: 3, last30DayPercent: 10 },
    ]);
  });

  it("never includes the raw dates array", () => {
    const payload = buildInsightPayload([habit(["2026-08-01"])], TODAY);

    for (const stat of payload.habits) {
      expect(stat).not.toHaveProperty("dates");
      expect(Object.keys(stat).sort()).toEqual(
        ["currentStreak", "last30DayPercent", "longestStreak", "name"].sort(),
      );
    }
  });
});
