export type WatchMode = "whitelist" | "blacklist";
export type TickStyle = "soft" | "classic" | "wood";
export type AmbientStyle = "moonlit" | "dreaming" | "deep";

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

export type RitualSettingsPatch = Partial<Pick<
  SettingsData,
  "overtimeEnabled" | "growthEvery" | "minimizeAfter" | "finalPopEvery"
>>;

export type SoundSettingsPatch = Partial<Pick<
  SettingsData,
  "tickEnabled" | "breakMusicEnabled" | "soundVolume" | "tickStyle" | "ambientStyle"
>>;
