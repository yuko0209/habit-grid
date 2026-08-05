"use client";

import { loadHabits, saveHabits } from "./storage";
import type { Habit } from "./habits";
import { useSyncExternalStore } from "react";

/**
 * localStorage is an external store, so it is read through
 * `useSyncExternalStore` rather than mirrored into state with an effect:
 * no load-then-setState cascade, and the server render has a defined value.
 */

const EMPTY: Habit[] = [];

let habits: Habit[] = EMPTY;
let isLoaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Habit[] {
  if (!isLoaded) {
    habits = loadHabits();
    isLoaded = true;
  }
  return habits;
}

/** The server has no storage to read, so it renders the empty state. */
function getServerSnapshot(): Habit[] {
  return EMPTY;
}

export function useHabits(): Habit[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateHabits(updater: (current: Habit[]) => Habit[]): void {
  habits = updater(getSnapshot());
  saveHabits(habits);
  emit();
}

/** Replaces everything — used when importing a backup. */
export function replaceHabits(next: Habit[]): void {
  updateHabits(() => next);
}
