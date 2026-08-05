"use client";

import { parseState, serializeState } from "./storage";
import { toDateKey } from "./date";
import type { Habit } from "./habits";

/**
 * Records live only in this browser's localStorage, so a JSON export is the
 * only way to survive clearing site data or moving to another device.
 */

export function backupFileName(today: Date): string {
  return `habit-grid-${toDateKey(today)}.json`;
}

export function downloadBackup(habits: Habit[], today: Date): void {
  const blob = new Blob([serializeState(habits)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName(today);
  link.click();

  URL.revokeObjectURL(url);
}

/** Rejects with a message meant for the user when the file isn't usable. */
export async function readBackup(file: File): Promise<Habit[]> {
  const text = await file.text();

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("JSON として読み取れませんでした。");
  }

  const habits = parseState(payload);
  if (!habits) {
    throw new Error("Habit Grid のバックアップファイル形式ではありません。");
  }
  return habits;
}
