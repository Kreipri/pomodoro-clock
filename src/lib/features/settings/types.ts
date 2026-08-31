/** How foreground titles are interpreted by the distraction rule matcher. */
export type WatchMode = "whitelist" | "blacklist";
/** Available synthesized focus tick characters. */
export type TickStyle = "soft" | "classic" | "wood";
/** Available synthesized break soundscapes. */
export type AmbientStyle = "moonlit" | "dreaming" | "deep";

/** Serializable settings shape shared by the store and persistence boundary. */
export type SettingsData = {
  watchMode: WatchMode;
  rules: string[];
  growthEvery: number;
  minimizeAfter: number;
  finalPopEvery: number;
  focusMinutes: number;
  breakMinutes: number;
  overtimeEnabled: boolean;
  tickEnabled: boolean;
  breakMusicEnabled: boolean;
  soundVolume: number;
  tickStyle: TickStyle;
  ambientStyle: AmbientStyle;
};

/** Settings changed by RitualSettingsTab in a single callback. */
export type RitualSettingsPatch = Partial<Pick<
  SettingsData,
  "overtimeEnabled" | "growthEvery" | "minimizeAfter" | "finalPopEvery"
>>;

/** Settings changed by SoundSettingsTab in a single callback. */
export type SoundSettingsPatch = Partial<Pick<
  SettingsData,
  "tickEnabled" | "breakMusicEnabled" | "soundVolume" | "tickStyle" | "ambientStyle"
>>;
