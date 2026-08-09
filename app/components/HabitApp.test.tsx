import HabitApp from "./HabitApp";
import { updateHabits } from "@/app/lib/habit-store";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** The store is module-level, so each test starts from a known empty state. */
beforeEach(() => {
  updateHabits(() => []);
});

async function addHabit(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByPlaceholderText(/新しい習慣/), name);
  await user.click(screen.getByRole("button", { name: "追加" }));
}

describe("HabitApp", () => {
  it("shows an empty state before any habit exists", () => {
    render(<HabitApp />);

    expect(screen.getByText(/まだ習慣がありません/)).toBeInTheDocument();
  });

  it("adds a habit and lists it with zeroed stats", async () => {
    const user = userEvent.setup();
    render(<HabitApp />);

    await addHabit(user, "朝ラン");

    const row = screen.getByRole("listitem");
    expect(within(row).getByText("朝ラン")).toBeInTheDocument();
    expect(within(row).getByText("🔥 継続 0日")).toBeInTheDocument();
    expect(screen.queryByText(/まだ習慣がありません/)).not.toBeInTheDocument();
  });

  it("records today and updates the streak, then undoes it", async () => {
    const user = userEvent.setup();
    render(<HabitApp />);
    await addHabit(user, "読書");

    await user.click(screen.getByRole("button", { name: /今日達成にする/ }));

    const row = screen.getByRole("listitem");
    expect(within(row).getByText("🔥 継続 1日")).toBeInTheDocument();
    expect(within(row).getByText("合計 1日")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /今日未達成に戻す/ }));
    expect(within(row).getByText("🔥 継続 0日")).toBeInTheDocument();
  });

  it("persists records to localStorage", async () => {
    const user = userEvent.setup();
    render(<HabitApp />);
    await addHabit(user, "水を飲む");
    await user.click(screen.getByRole("button", { name: /今日達成にする/ }));

    const stored = JSON.parse(window.localStorage.getItem("habit-grid:v1") ?? "{}");
    expect(stored.habits).toHaveLength(1);
    expect(stored.habits[0].name).toBe("水を飲む");
    expect(stored.habits[0].dates).toHaveLength(1);
  });

  it("deletes a habit after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<HabitApp />);
    await addHabit(user, "ストレッチ");

    await user.click(screen.getByRole("button", { name: "ストレッチ を削除" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText(/まだ習慣がありません/)).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it("keeps the habit when deletion is cancelled", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<HabitApp />);
    await addHabit(user, "日記");

    await user.click(screen.getByRole("button", { name: "日記 を削除" }));

    expect(screen.getByRole("listitem")).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it("shows the ranking only once a second habit exists", async () => {
    const user = userEvent.setup();
    render(<HabitApp />);

    await addHabit(user, "筋トレ");
    expect(screen.queryByRole("heading", { name: /^ランキング/ })).not.toBeInTheDocument();

    await addHabit(user, "読書");
    expect(screen.getByRole("heading", { name: /^ランキング/ })).toBeInTheDocument();
  });

  it("ranks the habit checked today above one that is not", async () => {
    const user = userEvent.setup();
    render(<HabitApp />);
    await addHabit(user, "筋トレ");
    await addHabit(user, "読書");

    await user.click(screen.getByRole("button", { name: /読書 を今日達成にする/ }));

    const ranking = screen.getByRole("list", { name: /ランキング/ });
    const entries = within(ranking).getAllByRole("listitem");

    expect(within(entries[0]).getByText("読書")).toBeInTheDocument();
    expect(within(entries[0]).getByText(/^1 \/ \d+日$/)).toBeInTheDocument();
    expect(within(entries[1]).getByText("筋トレ")).toBeInTheDocument();
  });

  it("makes grid cells clickable only when a single habit is selected", async () => {
    const user = userEvent.setup();
    render(<HabitApp />);
    await addHabit(user, "筋トレ");

    // The overview ("すべて") grid is read-only.
    expect(screen.queryByRole("button", { name: /達成$/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "筋トレ のグリッドを表示" }));

    const cells = screen.getAllByRole("button", { name: /未達成$/ });
    expect(cells.length).toBeGreaterThan(0);

    await user.click(cells.at(-1)!);
    expect(within(screen.getByRole("listitem")).getByText("合計 1日")).toBeInTheDocument();
  });
});
