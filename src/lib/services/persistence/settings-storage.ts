import type { ActivityData } from "$lib/features/activity/types";
import type { SettingsData } from "$lib/features/settings/types";
import { migratePersistedState, type PersistedAppState } from "./migrations";

const CURRENT_KEY = "nibbles-settings-v3";
const LEGACY_KEY = "nibbles-settings-v2";

/** Reads current data first, then transparently falls back to the legacy key. */
export function loadAppState(storage: Storage = localStorage): PersistedAppState {
  try {
    const saved = storage.getItem(CURRENT_KEY) ?? storage.getItem(LEGACY_KEY);
    return migratePersistedState(saved ? JSON.parse(saved) : null);
  } catch {
    return migratePersistedState(null);
  }
}

/** Writes plain feature snapshots rather than reactive store objects. */
export function saveAppState(settings: SettingsData, activity: ActivityData, storage: Storage = localStorage): void {
  try {
    const snapshot: PersistedAppState = { version: 3, settings, activity };
    storage.setItem(CURRENT_KEY, JSON.stringify(snapshot));
  } catch { /* A blocked or full storage backend should not stop the timer. */ }
}
