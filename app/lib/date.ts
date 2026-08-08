/**
 * Date helpers for the habit grid.
 *
 * Everything is keyed by a local-time `YYYY-MM-DD` string. We deliberately
 * avoid `toISOString()`, which converts to UTC and can shift the day for
 * users east/west of Greenwich.
 */

export type DateKey = string;

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` key into local midnight. */
export function fromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Local midnight of the given date, so day math is not tripped up by DST. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Whole days from `from` to `to`, ignoring time of day. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** Sunday of the week containing `date`, matching the grid's row order. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -startOfDay(date).getDay());
}

export type GridCell = {
  key: DateKey;
  date: Date;
  /** Days after today are rendered as empty placeholders. */
  isFuture: boolean;
};

/**
 * Builds the heatmap as columns of 7 days (Sunday first), ending with the
 * week that contains `today`. Trailing days of the current week are marked
 * as future so they render as gaps rather than clickable cells.
 */
export function buildGrid(today: Date, weeks: number): GridCell[][] {
  const lastWeekStart = startOfWeek(today);
  const firstWeekStart = addDays(lastWeekStart, -(weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, weekIndex) => {
    const weekStart = addDays(firstWeekStart, weekIndex * 7);
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(weekStart, dayIndex);
      return {
        key: toDateKey(date),
        date,
        isFuture: daysBetween(today, date) > 0,
      };
    });
  });
}

const MONTH_LABELS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

/**
 * Month labels for the grid header: one label per column, empty unless that
 * column is the first of a new month.
 */
export function monthLabels(grid: GridCell[][]): string[] {
  let previousMonth = -1;
  return grid.map((week) => {
    const month = week[0].date.getMonth();
    if (month === previousMonth) return "";
    previousMonth = month;
    return MONTH_LABELS[month];
  });
}

export function formatDateKey(key: DateKey): string {
  const date = fromDateKey(key);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日 (${weekday})`;
}
