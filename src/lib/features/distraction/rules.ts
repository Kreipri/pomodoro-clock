import type { WatchMode } from "$lib/features/settings/types";

/**
 * Matches only the visible window title without inspecting URLs, history, or content.
 * Empty titles and Nibbles itself are safe so monitoring cannot punish unavailable data.
 */
export function isTitleAllowed(title: string, mode: WatchMode, rules: string[]): boolean {
  const normalized = title.trim().toLocaleLowerCase();
  if (!normalized || normalized.includes("nibbles")) return true;

  const matchesRule = rules.some((rule) => normalized.includes(rule.toLocaleLowerCase()));
  return mode === "whitelist" ? matchesRule : !matchesRule;
}
