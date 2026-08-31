import { clampDuration } from "$lib/features/timer/timer";
import type { Phase, TimerConfig } from "$lib/features/timer/types";
import { DEFAULT_SETTINGS } from "./defaults";
import type { RitualSettingsPatch, SettingsData, SoundSettingsPatch, WatchMode } from "./types";

/**
 * Reactive, validated user preferences.
 * Persistence belongs to the app controller so this store remains storage-agnostic.
 */
export class SettingsStore {
  // Every field starts from one shared defaults object to keep reset/migration values aligned.
  watchMode = $state<WatchMode>(DEFAULT_SETTINGS.watchMode);
  rules = $state<string[]>([...DEFAULT_SETTINGS.rules]);
  growthEvery = $state(DEFAULT_SETTINGS.growthEvery);
  minimizeAfter = $state(DEFAULT_SETTINGS.minimizeAfter);
  finalPopEvery = $state(DEFAULT_SETTINGS.finalPopEvery);
  focusMinutes = $state(DEFAULT_SETTINGS.focusMinutes);
  breakMinutes = $state(DEFAULT_SETTINGS.breakMinutes);
  overtimeEnabled = $state(DEFAULT_SETTINGS.overtimeEnabled);
  tickEnabled = $state(DEFAULT_SETTINGS.tickEnabled);
  breakMusicEnabled = $state(DEFAULT_SETTINGS.breakMusicEnabled);
  soundVolume = $state(DEFAULT_SETTINGS.soundVolume);
  tickStyle = $state(DEFAULT_SETTINGS.tickStyle);
  ambientStyle = $state(DEFAULT_SETTINGS.ambientStyle);

  get timerConfig(): TimerConfig {
    // TimerStore receives only the subset it needs rather than the whole settings store.
    return {
      focusMinutes: this.focusMinutes,
      breakMinutes: this.breakMinutes,
      overtimeEnabled: this.overtimeEnabled
    };
  }

  hydrate(settings: SettingsData): void {
    // Migrations validate persisted input before it reaches this method.
    this.watchMode = settings.watchMode;
    this.rules = [...settings.rules];
    this.growthEvery = settings.growthEvery;
    this.minimizeAfter = settings.minimizeAfter;
    this.finalPopEvery = settings.finalPopEvery;
    this.focusMinutes = settings.focusMinutes;
    this.breakMinutes = settings.breakMinutes;
    this.overtimeEnabled = settings.overtimeEnabled;
    this.tickEnabled = settings.tickEnabled;
    this.breakMusicEnabled = settings.breakMusicEnabled;
    this.soundVolume = settings.soundVolume;
    this.tickStyle = settings.tickStyle;
    this.ambientStyle = settings.ambientStyle;
  }

  setWatchMode(mode: WatchMode): void { this.watchMode = mode; }

  addRule(value: string): void {
    const nextRule = value.trim();
    if (!nextRule) return;
    // Matching and duplicate detection are case-insensitive for window titles.
    const duplicate = this.rules.some((rule) => rule.toLocaleLowerCase() === nextRule.toLocaleLowerCase());
    if (!duplicate) this.rules = [...this.rules, nextRule];
  }

  removeRule(rule: string): void {
    this.rules = this.rules.filter((item) => item !== rule);
  }

  updateDuration(phase: Phase, minutes: number): number {
    // Return the normalized value so TimerStore can mirror it when currently idle.
    const safeValue = clampDuration(phase, minutes);
    if (phase === "focus") this.focusMinutes = safeValue;
    else this.breakMinutes = safeValue;
    return safeValue;
  }

  patchRitual(patch: RitualSettingsPatch): void {
    if (patch.overtimeEnabled !== undefined) this.overtimeEnabled = patch.overtimeEnabled;
    if (patch.growthEvery !== undefined) this.growthEvery = patch.growthEvery;
    if (patch.minimizeAfter !== undefined) this.minimizeAfter = patch.minimizeAfter;
    if (patch.finalPopEvery !== undefined) this.finalPopEvery = patch.finalPopEvery;
  }

  patchSound(patch: SoundSettingsPatch): void {
    if (patch.tickEnabled !== undefined) this.tickEnabled = patch.tickEnabled;
    if (patch.breakMusicEnabled !== undefined) this.breakMusicEnabled = patch.breakMusicEnabled;
    if (patch.soundVolume !== undefined) this.soundVolume = patch.soundVolume;
    if (patch.tickStyle !== undefined) this.tickStyle = patch.tickStyle;
    if (patch.ambientStyle !== undefined) this.ambientStyle = patch.ambientStyle;
  }

  snapshot(): SettingsData {
    // Copy arrays so persistence never holds a live reactive reference.
    return {
      watchMode: this.watchMode,
      rules: [...this.rules],
      growthEvery: this.growthEvery,
      minimizeAfter: this.minimizeAfter,
      finalPopEvery: this.finalPopEvery,
      focusMinutes: this.focusMinutes,
      breakMinutes: this.breakMinutes,
      overtimeEnabled: this.overtimeEnabled,
      tickEnabled: this.tickEnabled,
      breakMusicEnabled: this.breakMusicEnabled,
      soundVolume: this.soundVolume,
      tickStyle: this.tickStyle,
      ambientStyle: this.ambientStyle
    };
  }
}
