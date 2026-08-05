import BackupControls from "./BackupControls";
import { serializeState } from "@/app/lib/storage";
import { updateHabits } from "@/app/lib/habitStore";
import type { Habit } from "@/app/lib/habits";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TODAY = new Date(2026, 7, 5);

const habit: Habit = {
  id: "h1",
  name: "読書",
  color: "blue",
  createdAt: "2026-07-01",
  dates: ["2026-07-01"],
};

let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  updateHabits(() => []);
  // jsdom implements neither of these.
  createObjectURL = vi.fn(() => "blob:mock");
  revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function backupFile(contents: string): File {
  return new File([contents], "backup.json", { type: "application/json" });
}

describe("BackupControls", () => {
  it("disables export until there is something to export", () => {
    const { rerender } = render(<BackupControls habits={[]} today={TODAY} />);
    expect(screen.getByRole("button", { name: "エクスポート" })).toBeDisabled();

    rerender(<BackupControls habits={[habit]} today={TODAY} />);
    expect(screen.getByRole("button", { name: "エクスポート" })).toBeEnabled();
  });

  it("downloads a named file on export", async () => {
    const user = userEvent.setup();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<BackupControls habits={[habit]} today={TODAY} />);

    await user.click(screen.getByRole("button", { name: "エクスポート" }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    expect(await screen.findByRole("status")).toHaveTextContent("書き出しました");
  });

  it("imports a backup after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<BackupControls habits={[]} today={TODAY} />);

    await user.upload(
      screen.getByLabelText("バックアップファイルを選択"),
      backupFile(serializeState([habit])),
    );

    expect(await screen.findByRole("status")).toHaveTextContent("1件の習慣を読み込みました");
  });

  it("leaves the records untouched when the confirmation is declined", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<BackupControls habits={[]} today={TODAY} />);

    await user.upload(
      screen.getByLabelText("バックアップファイルを選択"),
      backupFile(serializeState([habit])),
    );

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("habit-grid:v1")).toContain('"habits":[]');
  });

  it("reports an unreadable file without asking to overwrite", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<BackupControls habits={[]} today={TODAY} />);

    await user.upload(screen.getByLabelText("バックアップファイルを選択"), backupFile("{oops"));

    expect(await screen.findByRole("status")).toHaveTextContent("JSON");
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
