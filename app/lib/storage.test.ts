import { loadHabits, saveHabits } from "./storage";
import type { Habit } from "./habits";
import { describe, expect, it } from "vitest";

const STORAGE_KEY = "habit-grid:v1";

const habit: Habit = {
  id: "h1",
  name: "読書",
  color: "blue",
  createdAt: "2026-07-01",
  dates: ["2026-07-01", "2026-07-02"],
};

describe("saveHabits / loadHabits", () => {
  it("round-trips habits through localStorage", () => {
    saveHabits([habit]);

    expect(loadHabits()).toEqual([habit]);
  });

  it("returns an empty list when nothing is stored", () => {
    expect(loadHabits()).toEqual([]);
  });
});

describe("loadHabits validation", () => {
  function store(value: unknown) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  it("ignores malformed JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadHabits()).toEqual([]);
  });

  it("drops entries missing required fields", () => {
    store({ version: 1, habits: [{ id: "x" }, habit] });

    expect(loadHabits()).toEqual([habit]);
  });

  it("falls back to green for an unknown color", () => {
    store({ version: 1, habits: [{ ...habit, color: "chartreuse" }] });

    expect(loadHabits()[0].color).toBe("green");
  });

  it("strips malformed date keys and duplicates", () => {
    store({ version: 1, habits: [{ ...habit, dates: ["2026-07-02", "nope", "2026-07-02", 5] }] });

    expect(loadHabits()[0].dates).toEqual(["2026-07-02"]);
  });

  it("ignores a payload whose habits field is not an array", () => {
    store({ version: 1, habits: "oops" });

    expect(loadHabits()).toEqual([]);
  });
});
