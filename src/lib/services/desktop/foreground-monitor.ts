import { invoke } from "@tauri-apps/api/core";

export type ForegroundWindowResult = {
  // False in browser preview or when the platform command is unavailable.
  supported: boolean;
  title: string;
};

/** Isolates the frontend from command names and native invocation details. */
export class ForegroundMonitor {
  async read(): Promise<ForegroundWindowResult> {
    try {
      const title = await invoke<string>("get_foreground_window_title");
      return { supported: true, title };
    } catch {
      return { supported: false, title: "" };
    }
  }

  async minimizeIfUnchanged(expectedTitle: string): Promise<boolean> {
    // Native code checks the title again to avoid minimizing a window focused moments later.
    try { return await invoke<boolean>("minimize_foreground_window", { expectedTitle }); }
    catch { return false; }
  }
}
