import type { SettingsData } from "./types";

// Keep all first-run/reset values here; migrations also fall back to these values.
export const DEFAULT_RULES = ["Figma", "Google Docs", "Notion", "Visual Studio Code"];

export const DEFAULT_SETTINGS: SettingsData = {
  watchMode: "whitelist",
  rules: [...DEFAULT_RULES],
  growthEvery: 15,
  minimizeAfter: 0,
  finalPopEvery: -1,
  focusMinutes: 25,
  breakMinutes: 5,
  overtimeEnabled: true,
  tickEnabled: true,
  breakMusicEnabled: true,
  soundVolume: 32,
  tickStyle: "soft",
  ambientStyle: "moonlit"
};
