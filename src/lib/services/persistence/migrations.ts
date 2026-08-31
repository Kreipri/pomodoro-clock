import { DEFAULT_SETTINGS } from "$lib/features/settings/defaults";
import type { SettingsData } from "$lib/features/settings/types";
import type { ActivityData, SessionLog } from "$lib/features/activity/types";

export type PersistedAppState = {
  version: 3;
  settings: SettingsData;
  activity: ActivityData;
};

const GROWTH_OPTIONS = [5, 10, 15, 30, 60];
const MINIMIZE_OPTIONS = [0, 15, 30, 60, 120];
const POPUP_OPTIONS = [-1, 0, 15, 30, 60];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSessionLog(value: unknown): value is SessionLog {
  if (!isRecord(value)) return false;
  return (value.phase === "focus" || value.phase === "break")
    && typeof value.completed === "boolean"
    && Number.isFinite(value.endedAt)
    && Number.isFinite(value.minutes)
    && Number.isFinite(value.overtimeSeconds)
    && (value.actualSeconds === undefined || Number.isFinite(value.actualSeconds));
}

/** Accepts both the legacy flat v2 snapshot and the separated v3 shape. */
export function migratePersistedState(value: unknown): PersistedAppState {
  const root = isRecord(value) ? value : {};
  const settingsSource = isRecord(root.settings) ? root.settings : root;
  const activitySource = isRecord(root.activity) ? root.activity : root;

  const settings: SettingsData = {
    watchMode: settingsSource.watchMode === "blacklist" ? "blacklist" : "whitelist",
    rules: Array.isArray(settingsSource.rules) && settingsSource.rules.every((rule) => typeof rule === "string") ? [...settingsSource.rules] : [...DEFAULT_SETTINGS.rules],
    growthEvery: GROWTH_OPTIONS.includes(Number(settingsSource.growthEvery)) ? Number(settingsSource.growthEvery) : DEFAULT_SETTINGS.growthEvery,
    minimizeAfter: MINIMIZE_OPTIONS.includes(Number(settingsSource.minimizeAfter)) ? Number(settingsSource.minimizeAfter) : DEFAULT_SETTINGS.minimizeAfter,
    finalPopEvery: POPUP_OPTIONS.includes(Number(settingsSource.finalPopEvery)) ? Number(settingsSource.finalPopEvery) : DEFAULT_SETTINGS.finalPopEvery,
    focusMinutes: Number.isFinite(settingsSource.focusMinutes) ? Math.max(1, Math.min(180, Number(settingsSource.focusMinutes))) : DEFAULT_SETTINGS.focusMinutes,
    breakMinutes: Number.isFinite(settingsSource.breakMinutes) ? Math.max(1, Math.min(90, Number(settingsSource.breakMinutes))) : DEFAULT_SETTINGS.breakMinutes,
    overtimeEnabled: typeof settingsSource.overtimeEnabled === "boolean" ? settingsSource.overtimeEnabled : DEFAULT_SETTINGS.overtimeEnabled,
    tickEnabled: typeof settingsSource.tickEnabled === "boolean" ? settingsSource.tickEnabled : DEFAULT_SETTINGS.tickEnabled,
    breakMusicEnabled: typeof settingsSource.breakMusicEnabled === "boolean" ? settingsSource.breakMusicEnabled : DEFAULT_SETTINGS.breakMusicEnabled,
    soundVolume: Number.isFinite(settingsSource.soundVolume) ? Math.max(0, Math.min(100, Number(settingsSource.soundVolume))) : DEFAULT_SETTINGS.soundVolume,
    tickStyle: settingsSource.tickStyle === "classic" || settingsSource.tickStyle === "wood" ? settingsSource.tickStyle : "soft",
    ambientStyle: settingsSource.ambientStyle === "dreaming" || settingsSource.ambientStyle === "deep" ? settingsSource.ambientStyle : "moonlit"
  };

  return {
    version: 3,
    settings,
    activity: {
      completedFocuses: Number.isFinite(activitySource.completedFocuses) ? Math.max(0, Number(activitySource.completedFocuses)) : 0,
      sessionLogs: Array.isArray(activitySource.sessionLogs) ? activitySource.sessionLogs.filter(isSessionLog).slice(0, 100) : []
    }
  };
}
