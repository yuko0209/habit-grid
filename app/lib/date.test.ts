import {
  addMonths,
  buildGrid,
  daysBetween,
  endOfMonth,
  fromDateKey,
  monthLabels,
  monthPeriod,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from "./date";
import { describe, expect, it } from "vitest";

describe("toDateKey", () => {
  it("uses local time rather than UTC", () => {
    // In JST, 08:00 on the 6th is still the 5th in UTC, so anything derived
    // from toISOString() would report the wrong day every morning.
    expect(toDateKey(new Date(2026, 7, 6, 8, 0))).toBe("2026-08-06");
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

describe("startOfMonth / endOfMonth", () => {
  it("finds the first and last day of the month", () => {
    expect(toDateKey(startOfMonth(new Date(2026, 7, 9)))).toBe("2026-08-01");
    expect(toDateKey(endOfMonth(new Date(2026, 7, 9)))).toBe("2026-08-31");
  });

  it("handles a short month", () => {
    expect(toDateKey(endOfMonth(new Date(2026, 1, 10)))).toBe("2026-02-28");
  });

  it("handles a leap year", () => {
    expect(toDateKey(endOfMonth(new Date(2028, 1, 10)))).toBe("2028-02-29");
  });
});

describe("addMonths", () => {
  it("returns the first of the shifted month", () => {
    expect(toDateKey(addMonths(new Date(2026, 7, 9), -1))).toBe("2026-07-01");
  });

  it("does not overflow when the target month is shorter", () => {
    // Naively subtracting a month from March 31 lands back in March,
    // because February 31 does not exist.
    expect(toDateKey(addMonths(new Date(2026, 2, 31), -1))).toBe("2026-02-01");
  });

  it("crosses a year boundary", () => {
    expect(toDateKey(addMonths(new Date(2026, 0, 15), -1))).toBe("2025-12-01");
  });
});

describe("monthPeriod", () => {
  const today = new Date(2026, 7, 9);

  it("ends the current month at today, not at the last of the month", () => {
    const period = monthPeriod(today, 0);

    expect(period.start).toBe("2026-08-01");
    expect(period.end).toBe("2026-08-09");
    expect(period.days).toBe(9);
    expect(period.label).toBe("8月");
  });

  it("covers a past month in full", () => {
    const period = monthPeriod(today, -1);

    expect(period.start).toBe("2026-07-01");
    expect(period.end).toBe("2026-07-31");
    expect(period.days).toBe(31);
    expect(period.label).toBe("7月");
  });

  it("is a single day on the first of the month", () => {
    expect(monthPeriod(new Date(2026, 7, 1), 0).days).toBe(1);
  });

  it("covers the whole month on its last day", () => {
    expect(monthPeriod(new Date(2026, 7, 31), 0).days).toBe(31);
  });
});
