import { useToday } from "./clock";
import { toDateKey } from "./date";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 5, 22, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the current local day", () => {
    const { result } = renderHook(() => useToday());

    expect(toDateKey(result.current!)).toBe("2026-08-05");
  });

  it("returns local midnight, not the current time", () => {
    const { result } = renderHook(() => useToday());

    expect(result.current!.getHours()).toBe(0);
    expect(result.current!.getMinutes()).toBe(0);
  });

  it("rolls over to the next day at midnight", () => {
    const { result } = renderHook(() => useToday());
    expect(toDateKey(result.current!)).toBe("2026-08-05");

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 2000); // just past midnight
    });

    expect(toDateKey(result.current!)).toBe("2026-08-06");
  });

  it("keeps the same object identity within a day", () => {
    const { result, rerender } = renderHook(() => useToday());
    const first = result.current;

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });
    rerender();

    expect(result.current).toBe(first);
  });

  it("catches up when the tab becomes visible again", () => {
    const { result } = renderHook(() => useToday());

    // Timers can be starved while the machine sleeps, so the visibility
    // event has to re-read the clock on its own.
    act(() => {
      vi.setSystemTime(new Date(2026, 7, 7, 9, 0));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(toDateKey(result.current!)).toBe("2026-08-07");
  });
});
