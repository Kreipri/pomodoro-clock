import type { Phase } from "$lib/features/timer/types";

export type LogFilter = "all" | Phase;

export type SessionLog = {
  phase: Phase;
  completed: boolean;
  endedAt: number;
  minutes: number;
  overtimeSeconds: number;
  actualSeconds?: number;
};

export type SessionUpdate = {
  log: SessionLog;
  replaceLatest: boolean;
  incrementsCompletedFocuses: boolean;
};

export type TrendDay = {
  key: number;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
};

export type ActivityData = {
  completedFocuses: number;
  sessionLogs: SessionLog[];
};
