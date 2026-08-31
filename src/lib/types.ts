// Shared UI-facing exports. Feature implementations import from their own modules.
export type { Phase } from "$lib/features/timer/types";
export type { AmbientStyle, TickStyle, WatchMode } from "$lib/features/settings/types";
export type { LogFilter, SessionLog, TrendDay } from "$lib/features/activity/types";

export type MenuView = "settings" | "sound" | "activity";
