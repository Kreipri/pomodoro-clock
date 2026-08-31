export type Phase = "focus" | "break";

export type TimerConfig = {
  focusMinutes: number;
  breakMinutes: number;
  overtimeEnabled: boolean;
};
