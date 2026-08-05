import { backupFileName, readBackup } from "./backup";
import { serializeState } from "./storage";
import type { Habit } from "./habits";
import { describe, expect, it } from "vitest";

const habit: Habit = {
  id: "h1",
  name: "読書",
  color: "blue",
  createdAt: "2026-07-01",
  dates: ["2026-07-01", "2026-07-02"],
};

function jsonFile(contents: string): File {
  return new File([contents], "backup.json", { type: "application/json" });
}

describe("backupFileName", () => {
  it("includes the local date", () => {
    expect(backupFileName(new Date(2026, 7, 5))).toBe("habit-grid-2026-08-05.json");
  });
});

describe("readBackup", () => {
  it("round-trips an exported payload", async () => {
    const habits = await readBackup(jsonFile(serializeState([habit])));

    expect(habits).toEqual([habit]);
  });

  it("rejects a file that is not JSON", async () => {
    await expect(readBackup(jsonFile("not json at all"))).rejects.toThrow(/JSON/);
  });

  it("rejects JSON that is not a Habit Grid backup", async () => {
    await expect(readBackup(jsonFile('{"foo":1}'))).rejects.toThrow(/バックアップ/);
  });

  it("drops invalid habits inside an otherwise valid payload", async () => {
    const payload = JSON.stringify({ version: 1, habits: [habit, { id: "broken" }] });

    expect(await readBackup(jsonFile(payload))).toEqual([habit]);
  });

  it("accepts a backup with no habits", async () => {
    expect(await readBackup(jsonFile('{"version":1,"habits":[]}'))).toEqual([]);
  });
});
