import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import HabitGrid from "./HabitGrid";
import { startOfDay } from "@/app/lib/date";

describe("HabitGrid", () => {
  let scrollLeftSpy: MockInstance;

  beforeEach(() => {
    // Mock scrollWidth and clientWidth to return some test values
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 300,
    });

    // Spy on scrollLeft setter
    scrollLeftSpy = vi.spyOn(HTMLElement.prototype, "scrollLeft", "set");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets scrollLeft to the right end on mount", () => {
    const today = startOfDay(new Date());
    render(
      <HabitGrid
        today={today}
        color="green"
        levelFor={() => 0}
        labelFor={() => ""}
      />
    );

    // Expected scrollLeft should be scrollWidth - clientWidth = 1000 - 300 = 700
    expect(scrollLeftSpy).toHaveBeenCalledWith(700);
  });

  it("updates scrollLeft when today changes (date rolls over)", () => {
    const today1 = new Date(2026, 7, 20);
    const today2 = new Date(2026, 7, 21);

    const { rerender } = render(
      <HabitGrid
        today={today1}
        color="green"
        levelFor={() => 0}
        labelFor={() => ""}
      />
    );

    expect(scrollLeftSpy).toHaveBeenCalledWith(700);
    scrollLeftSpy.mockClear();

    // Rerender with a new day
    rerender(
      <HabitGrid
        today={today2}
        color="green"
        levelFor={() => 0}
        labelFor={() => ""}
      />
    );

    expect(scrollLeftSpy).toHaveBeenCalledWith(700);
  });

  it("does not reset scrollLeft when today does not change (e.g., other prop updates)", () => {
    const today = new Date(2026, 7, 20);

    const { rerender } = render(
      <HabitGrid
        today={today}
        color="green"
        levelFor={() => 0}
        labelFor={() => ""}
      />
    );

    expect(scrollLeftSpy).toHaveBeenCalledWith(700);
    scrollLeftSpy.mockClear();

    // Rerender with same day but different color
    rerender(
      <HabitGrid
        today={today}
        color="blue"
        levelFor={() => 0}
        labelFor={() => ""}
      />
    );

    expect(scrollLeftSpy).not.toHaveBeenCalled();
  });
});
