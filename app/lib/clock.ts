"use client";

import { addDays, startOfDay, toDateKey } from "./date";
import { useSyncExternalStore } from "react";

/**
 * "Today" as an external store.
 *
 * A tab left open overnight must not keep reporting yesterday, so the value
 * is re-read at midnight, and again whenever the tab is revisited — timers do
 * not fire reliably while a machine is asleep.
 */

let cached: Date | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/** Identity only changes when the calendar day does, keeping renders stable. */
function getSnapshot(): Date {
  const now = new Date();
  if (!cached || toDateKey(cached) !== toDateKey(now)) {
    cached = startOfDay(now);
  }
  return cached;
}

/** The server has no meaningful clock for the visitor's time zone. */
function getServerSnapshot(): null {
  return null;
}

function emit() {
  for (const listener of listeners) listener();
}

function msUntilNextMidnight(): number {
  const now = new Date();
  // One extra second of slack so the timer never lands just before midnight.
  return addDays(now, 1).getTime() - now.getTime() + 1000;
}

function scheduleMidnight() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    emit();
    scheduleMidnight();
  }, msUntilNextMidnight());
}

function handleVisibility() {
  if (document.visibilityState === "visible") {
    emit();
    scheduleMidnight();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    scheduleMidnight();
    document.addEventListener("visibilitychange", handleVisibility);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}

/** Local midnight of the current day; null until hydration completes. */
export function useToday(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
