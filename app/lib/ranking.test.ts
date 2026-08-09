import { monthPeriod } from "./date";
import type { Habit } from "./habits";
import { countInPeriod, rankHabits, rankThisMonth } from "./ranking";
import { describe, expect, it } from "vitest";

/** 2026-08-09 is a Sunday; August has 31 days, July 31. */
const TODAY = new Date(2026, 7, 9);
const AUGUST = monthPeriod(TODAY, 0);
const JULY = monthPeriod(TODAY, -1);

function habit(name: string, dates: string[], createdAt = "2026-01-01"): Habit {
  return { id: name, name, color: "green", createdAt, dates };
}

/** Every day of August up to and including `day`. */
function augustThrough(day: number): string[] {
  return Array.from({ length: day }, (_, i) => `2026-08-${String(i + 1).padStart(2, "0")}`);
}

describe("countInPeriod", () => {
  it("counts only days inside the period", () => {
    const subject = habit("A", ["2026-07-31", "2026-08-01", "2026-08-09", "2026-09-01"]);

    expect(countInPeriod(subject, AUGUST)).toBe(2);
    expect(countInPeriod(subject, JULY)).toBe(1);
  });

  it("ignores days after today within the current month", () => {
    // The period ends today, so a stray future record cannot inflate the count.
    expect(countInPeriod(habit("A", ["2026-08-20"]), AUGUST)).toBe(0);
  });
});

describe("rankHabits", () => {
  it("orders by days completed in the period", () => {
    const ranked = rankHabits(
      [
        habit("少ない", augustThrough(2)),
        habit("多い", augustThrough(7)),
        habit("中くらい", augustThrough(4)),
      ],
      AUGUST,
      "done",
    );

    expect(ranked.map((entry) => entry.habit.name)).toEqual(["多い", "中くらい", "少ない"]);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 3]);
  });

  it("gives tied habits the same rank and skips the slots they consume", () => {
    const ranked = rankHabits(
      [
        habit("A", augustThrough(5)),
        habit("B", augustThrough(1)),
        habit("C", augustThrough(3)),
        habit("D", augustThrough(3)),
      ],
      AUGUST,
      "done",
    );

    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 2, 4]);
  });

  it("marks which entries are tied", () => {
    const ranked = rankHabits(
      [habit("A", augustThrough(3)), habit("B", augustThrough(3)), habit("C", augustThrough(1))],
      AUGUST,
      "done",
    );

    expect(ranked.map((entry) => entry.isTied)).toEqual([true, true, false]);
  });

  it("measures the bar against the period, not against the leader", () => {
    // 9 days have elapsed in August, so 9/9 fills the bar and 3/9 is a third.
    const ranked = rankHabits(
      [habit("完璧", augustThrough(9)), habit("三分の一", augustThrough(3))],
      AUGUST,
      "done",
    );

    expect(ranked[0].percent).toBe(100);
    expect(ranked[1].percent).toBe(33);
  });

  it("leaves the leader short of full when it has missed days", () => {
    const ranked = rankHabits(
      [habit("先頭", augustThrough(4)), habit("後ろ", augustThrough(2))],
      AUGUST,
      "done",
    );

    // The old behaviour scaled against the leader, which always read 100%.
    expect(ranked[0].percent).toBe(44);
  });

  it("ranks by the streak as it stood at the end of the period", () => {
    const ranked = rankHabits(
      [
        habit("7月に途切れた", ["2026-07-01", "2026-07-02", "2026-07-03"]),
        habit("継続中", ["2026-08-08", "2026-08-09"]),
      ],
      AUGUST,
      "streak",
    );

    expect(ranked[0].habit.name).toBe("継続中");
    expect(ranked[0].value).toBe(2);
    expect(ranked[1].value).toBe(0);
  });

  it("keeps habits with nothing recorded", () => {
    const ranked = rankHabits([habit("あり", augustThrough(1)), habit("なし", [])], AUGUST, "done");

    expect(ranked).toHaveLength(2);
    expect(ranked[1].value).toBe(0);
    expect(ranked[1].percent).toBe(0);
  });

  it("breaks ties by name so the order holds when the metric changes", () => {
    const ranked = rankHabits(
      [habit("いぬ", augustThrough(1)), habit("あひる", augustThrough(1))],
      AUGUST,
      "done",
    );

    expect(ranked.map((entry) => entry.habit.name)).toEqual(["あひる", "いぬ"]);
  });

  it("reports every habit as new without a comparison period", () => {
    const ranked = rankHabits([habit("A", augustThrough(2)), habit("B", [])], AUGUST, "done");

    expect(ranked.every((entry) => entry.delta.kind === "new")).toBe(true);
  });

  it("does not mutate the habits it is given", () => {
    const habits = [habit("A", augustThrough(1)), habit("B", augustThrough(2))];

    rankHabits(habits, AUGUST, "done", JULY);

    expect(habits.map((entry) => entry.name)).toEqual(["A", "B"]);
  });
});

describe("rankHabits — 先月比", () => {
  it("reports a rise when the habit overtakes another", () => {
    const climber = habit("上昇", [...julyDays(2), ...augustThrough(9)]);
    const faller = habit("下降", [...julyDays(20), "2026-08-01"]);

    const ranked = rankHabits([climber, faller], AUGUST, "done", JULY);

    expect(ranked[0].habit.name).toBe("上昇");
    expect(ranked[0].delta).toEqual({ kind: "up", places: 1 });
    expect(ranked[1].delta).toEqual({ kind: "down", places: 1 });
  });

  it("reports no change when the order holds", () => {
    const ranked = rankHabits(
      [
        habit("先頭", [...julyDays(20), ...augustThrough(9)]),
        habit("二番手", [...julyDays(5), ...augustThrough(2)]),
      ],
      AUGUST,
      "done",
      JULY,
    );

    expect(ranked.map((entry) => entry.delta)).toEqual([{ kind: "same" }, { kind: "same" }]);
  });

  it("marks a habit created this month as new rather than as a fall", () => {
    const ranked = rankHabits(
      [
        habit("既存", [...julyDays(10), ...augustThrough(9)]),
        habit("今月から", augustThrough(3), "2026-08-05"),
      ],
      AUGUST,
      "done",
      JULY,
    );

    expect(ranked[1].habit.name).toBe("今月から");
    expect(ranked[1].delta).toEqual({ kind: "new" });
  });

  it("treats a habit created last month as existing, even with no records", () => {
    const ranked = rankHabits(
      [
        habit("既存A", augustThrough(9), "2026-07-15"),
        habit("既存B", augustThrough(1), "2026-07-15"),
      ],
      AUGUST,
      "done",
      JULY,
    );

    // Both had zero days in July, so both were tied first and B has slipped.
    expect(ranked[0].delta).toEqual({ kind: "same" });
    expect(ranked[1].delta).toEqual({ kind: "down", places: 1 });
  });
});

describe("rankThisMonth", () => {
  it("uses the current calendar month, ending today", () => {
    const { period } = rankThisMonth([], TODAY, "done");

    expect(period.start).toBe("2026-08-01");
    expect(period.end).toBe("2026-08-09");
    expect(period.days).toBe(9);
    expect(period.label).toBe("8月");
  });

  it("compares against the previous month", () => {
    const { ranked } = rankThisMonth(
      [
        habit("先月からいる", [...julyDays(5), ...augustThrough(1)], "2026-07-01"),
        habit("今月から", augustThrough(9), "2026-08-01"),
      ],
      TODAY,
      "done",
    );

    expect(ranked[0].habit.name).toBe("今月から");
    expect(ranked[0].delta).toEqual({ kind: "new" });
    expect(ranked[1].delta).toEqual({ kind: "down", places: 1 });
  });
});

function julyDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
}
