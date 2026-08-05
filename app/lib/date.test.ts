import { buildGrid, daysBetween, fromDateKey, monthLabels, startOfWeek, toDateKey } from "./date";
import { describe, expect, it } from "vitest";

describe("toDateKey", () => {
  it("uses local time rather than UTC", () => {
    // 23:30 local on the 5th is already the 6th in UTC for JST.
    expect(toDateKey(new Date(2026, 7, 5, 23, 30))).toBe("2026-08-05");
  });

  it("zero-pads month and day", () => {
    expect(toDateKey(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  it("round-trips through fromDateKey", () => {
    expect(toDateKey(fromDateKey("2026-02-28"))).toBe("2026-02-28");
  });
});

describe("daysBetween", () => {
  it("counts whole days regardless of time of day", () => {
    expect(daysBetween(new Date(2026, 7, 1, 23, 0), new Date(2026, 7, 3, 1, 0))).toBe(2);
  });

  it("is negative when the target is in the past", () => {
    expect(daysBetween(new Date(2026, 7, 5), new Date(2026, 7, 1))).toBe(-4);
  });

  it("crosses month boundaries", () => {
    expect(daysBetween(new Date(2026, 6, 30), new Date(2026, 7, 2))).toBe(3);
  });
});

describe("startOfWeek", () => {
  it("returns the Sunday of the containing week", () => {
    // 2026-08-05 is a Wednesday.
    expect(toDateKey(startOfWeek(new Date(2026, 7, 5)))).toBe("2026-08-02");
  });

  it("leaves a Sunday untouched", () => {
    expect(toDateKey(startOfWeek(new Date(2026, 7, 2)))).toBe("2026-08-02");
  });
});

describe("buildGrid", () => {
  const today = new Date(2026, 7, 5); // Wednesday
  const grid = buildGrid(today, 27);

  it("produces the requested number of week columns, 7 days each", () => {
    expect(grid).toHaveLength(27);
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it("ends with the week containing today", () => {
    const lastWeek = grid.at(-1)!;
    expect(lastWeek.map((cell) => cell.key)).toContain(toDateKey(today));
  });

  it("marks days after today as future and nothing before", () => {
    const cells = grid.flat();
    const futureKeys = cells.filter((cell) => cell.isFuture).map((cell) => cell.key);

    expect(futureKeys).toEqual(["2026-08-06", "2026-08-07", "2026-08-08"]);
  });

  it("starts every column on a Sunday", () => {
    expect(grid.every((week) => week[0].date.getDay() === 0)).toBe(true);
  });
});

describe("monthLabels", () => {
  it("labels only the first column of each month", () => {
    const labels = monthLabels(buildGrid(new Date(2026, 7, 5), 27));

    expect(labels.filter(Boolean).length).toBeGreaterThan(0);
    // No month is ever labelled twice in a row.
    const filled = labels.filter(Boolean);
    expect(new Set(filled).size).toBe(filled.length);
  });
});
