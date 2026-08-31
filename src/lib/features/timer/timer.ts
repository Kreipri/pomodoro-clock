import type { Phase, TimerConfig } from "./types";

export function phaseDurationSeconds(phase: Phase, config: TimerConfig): number {
  return (phase === "focus" ? config.focusMinutes : config.breakMinutes) * 60;
}

export function clampDuration(phase: Phase, minutes: number): number {
  const maximum = phase === "focus" ? 180 : 90;
  return Math.max(1, Math.min(maximum, minutes || 1));
}

export function formatClock(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function timerProgress(secondsLeft: number, phase: Phase, config: TimerConfig): number {
  const plannedSeconds = phaseDurationSeconds(phase, config);
  return Math.max(0, Math.min(1, secondsLeft / plannedSeconds));
}
