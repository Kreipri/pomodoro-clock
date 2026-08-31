import type { Phase, TimerConfig } from "./types";

/** Pure timer helpers live here so they can be tested without Svelte state. */

/** Converts the configured duration for a phase into the store's seconds unit. */
export function phaseDurationSeconds(phase: Phase, config: TimerConfig): number {
  return (phase === "focus" ? config.focusMinutes : config.breakMinutes) * 60;
}

/** Enforces UI-supported limits and turns empty/zero input into one minute. */
export function clampDuration(phase: Phase, minutes: number): number {
  const maximum = phase === "focus" ? 180 : 90;
  return Math.max(1, Math.min(maximum, minutes || 1));
}

/** Formats a non-negative second count as the timer's MM:SS display. */
export function formatClock(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Returns a clamped 0-1 value consumed by the radial SVG progress ring. */
export function timerProgress(secondsLeft: number, phase: Phase, config: TimerConfig): number {
  const plannedSeconds = phaseDurationSeconds(phase, config);
  return Math.max(0, Math.min(1, secondsLeft / plannedSeconds));
}
