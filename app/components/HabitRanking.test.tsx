import HabitRanking from "./HabitRanking";
import type { Habit } from "@/app/lib/habits";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

const TODAY = new Date(2026, 7, 9); // 9 days elapsed in August

function habit(name: string, dates: string[], createdAt = "2026-01-01"): Habit {
  return { id: name, name, color: "green", createdAt, dates };
}

function augustThrough(day: number): string[] {
  return Array.from({ length: day }, (_, i) => `2026-08-${String(i + 1).padStart(2, "0")}`);
}

function julyDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
}

function rankingEntries() {
  return within(screen.getByRole("list", { name: /ランキング/ })).getAllByRole("listitem");
}

describe("HabitRanking", () => {
  it("renders nothing for fewer than two habits", () => {
    const { container } = render(
      <HabitRanking habits={[habit("ひとつ", augustThrough(1))]} today={TODAY} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("names the period and how much of it has elapsed", () => {
    render(<HabitRanking habits={[habit("A", []), habit("B", [])]} today={TODAY} />);

    expect(screen.getByText("8月・9日経過")).toBeInTheDocument();
  });

  it("orders by days completed this month", () => {
    render(
      <HabitRanking
        habits={[habit("少ない", augustThrough(2)), habit("多い", augustThrough(7))]}
        today={TODAY}
      />,
    );

    const entries = rankingEntries();
    expect(within(entries[0]).getByText("多い")).toBeInTheDocument();
    expect(within(entries[0]).getByText("7 / 9日")).toBeInTheDocument();
  });

  it("measures the bar against the period, so the leader can fall short", () => {
    render(
      <HabitRanking
        habits={[habit("先頭", augustThrough(4)), habit("後ろ", augustThrough(2))]}
        today={TODAY}
      />,
    );

    // 4 of 9 elapsed days, not 100% just for being first.
    expect(within(rankingEntries()[0]).getByText("44%")).toBeInTheDocument();
  });

  it("labels tied habits and gives them the same number", () => {
    render(
      <HabitRanking
        habits={[habit("A", augustThrough(3)), habit("B", augustThrough(3))]}
        today={TODAY}
      />,
    );

    const entries = rankingEntries();
    expect(within(entries[0]).getByText("同率")).toBeInTheDocument();
    expect(within(entries[1]).getByText("同率")).toBeInTheDocument();
    expect(within(entries[0]).getByText("同率1位")).toBeInTheDocument();
    expect(within(entries[1]).getByText("同率1位")).toBeInTheDocument();
  });

  it("does not label a sole leader as tied", () => {
    render(
      <HabitRanking
        habits={[habit("A", augustThrough(3)), habit("B", augustThrough(1))]}
        today={TODAY}
      />,
    );

    expect(screen.queryByText("同率")).not.toBeInTheDocument();
    expect(within(rankingEntries()[0]).getByText("1位")).toBeInTheDocument();
  });

  it("spells out how each habit moved since last month", () => {
    render(
      <HabitRanking
        habits={[
          habit("上昇", [...julyDays(2), ...augustThrough(9)], "2026-07-01"),
          habit("下降", [...julyDays(20), "2026-08-01"], "2026-07-01"),
        ]}
        today={TODAY}
      />,
    );

    const entries = rankingEntries();
    expect(within(entries[0]).getByText("先月より1つ上昇")).toBeInTheDocument();
    expect(within(entries[1]).getByText("先月より1つ下降")).toBeInTheDocument();
  });

  it("marks a habit created this month as new", () => {
    render(
      <HabitRanking
        habits={[
          habit("既存", [...julyDays(10), ...augustThrough(9)], "2026-07-01"),
          habit("新入り", augustThrough(3), "2026-08-05"),
        ]}
        today={TODAY}
      />,
    );

    expect(within(rankingEntries()[1]).getByText("新入り")).toBeInTheDocument();
    expect(within(rankingEntries()[1]).getByText("NEW")).toBeInTheDocument();
    expect(within(rankingEntries()[1]).getByText("今月から")).toBeInTheDocument();
  });

  it("reorders when the streak metric is chosen", async () => {
    const user = userEvent.setup();
    render(
      <HabitRanking
        habits={[
          habit("7月にたくさん", julyDays(20), "2026-07-01"),
          habit("いま継続中", ["2026-08-08", "2026-08-09"], "2026-07-01"),
        ]}
        today={TODAY}
      />,
    );

    await user.click(screen.getByRole("button", { name: "継続" }));

    expect(within(rankingEntries()[0]).getByText("いま継続中")).toBeInTheDocument();
    expect(within(rankingEntries()[0]).getByText("2日")).toBeInTheDocument();
  });

  it("marks the active metric button", async () => {
    const user = userEvent.setup();
    render(<HabitRanking habits={[habit("A", []), habit("B", [])]} today={TODAY} />);

    expect(screen.getByRole("button", { name: "達成" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "継続" }));

    expect(screen.getByRole("button", { name: "継続" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "達成" })).toHaveAttribute("aria-pressed", "false");
  });

  it("still lists a habit that has never been completed", () => {
    render(
      <HabitRanking habits={[habit("あり", augustThrough(1)), habit("なし", [])]} today={TODAY} />,
    );

    const entries = rankingEntries();
    expect(within(entries[1]).getByText("なし")).toBeInTheDocument();
    expect(within(entries[1]).getByText("0 / 9日")).toBeInTheDocument();
  });
});
