/** The two phases in one Pomodoro cycle. */
export type Phase = "focus" | "break";

/** Minimal settings projection required by TimerStore and pure timer helpers. */
export type TimerConfig = {
  focusMinutes: number;
  breakMinutes: number;
  overtimeEnabled: boolean;
};
