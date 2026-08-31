import type { Phase } from "$lib/features/timer/types";

/** Which session phases ActivityTab should display. */
export type LogFilter = "all" | Phase;

/** Persisted record of one completed, skipped, or stopped phase. */
export type SessionLog = {
  phase: Phase;
  completed: boolean;
  endedAt: number;
  minutes: number;
  overtimeSeconds: number;
  actualSeconds?: number;
};

/** Instruction emitted by TimerStore and applied by ActivityStore. */
export type SessionUpdate = {
  log: SessionLog;
  replaceLatest: boolean; // Used when finalizing an already-logged overtime session.
  incrementsCompletedFocuses: boolean; // Keeps the lifetime counter idempotent.
};

/** One chart column containing totals for a local calendar day. */
export type TrendDay = {
  key: number;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
};

/** Serializable portion of ActivityStore. */
export type ActivityData = {
  completedFocuses: number;
  sessionLogs: SessionLog[];
};
