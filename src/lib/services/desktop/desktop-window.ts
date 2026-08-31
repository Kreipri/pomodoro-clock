import { getCurrentWindow, LogicalSize, type Window as TauriWindow } from "@tauri-apps/api/window";

function currentTauriWindow(): TauriWindow | null {
  // Vite browser preview has no Tauri internals; a null adapter keeps UI work possible.
  return "__TAURI_INTERNALS__" in window ? getCurrentWindow() : null;
}

/** Browser-safe adapter around the frameless Tauri window. */
export class DesktopWindowService {
  private readonly appWindow = currentTauriWindow();

  async setTitle(title: string): Promise<void> {
    try { await this.appWindow?.setTitle(title); } catch { /* Browser preview or closed window. */ }
  }

  async applyLayoutState(stage: number, menuOpen: boolean): Promise<void> {
    if (!this.appWindow) return;
    try {
      const screenWidth = window.screen.availWidth || 1280;
      const screenHeight = window.screen.availHeight || 800;
      // Warning forms receive progressively larger windows; the menu has one fixed layout.
      const sizes = menuOpen ? [[480, Math.min(600, screenHeight * .76)]] : [
        [320, 300], [380, 360],
        [Math.min(600, screenWidth * .42), Math.min(560, screenHeight * .58)],
        [Math.min(980, screenWidth * .58), Math.min(820, screenHeight * .76)]
      ];
      const [width, height] = menuOpen ? sizes[0] : sizes[stage];
      await this.appWindow.setSize(new LogicalSize(Math.round(width), Math.round(height)));
      await this.appWindow.center();
      // The compact companion is user-locked, but programmatic stage growth still
      // uses setSize above. Opening the menu restores normal resize handles.
      await this.appWindow.setResizable(menuOpen);
    } catch { /* The native window may be unavailable during shutdown. */ }
  }

  async isPinned(): Promise<boolean> {
    try { return await this.appWindow?.isAlwaysOnTop() ?? true; } catch { return true; }
  }

  async setPinned(pinned: boolean): Promise<void> {
    try { await this.appWindow?.setAlwaysOnTop(pinned); } catch { /* Browser preview. */ }
  }

  async startDragging(event: PointerEvent): Promise<void> {
    // Interactive controls must receive clicks instead of starting a native drag.
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, input, select, label")) return;
    event.preventDefault();
    try { await this.appWindow?.startDragging(); } catch { /* Browser preview. */ }
  }

  async minimize(): Promise<void> { try { await this.appWindow?.minimize(); } catch { /* Window closed. */ } }
  async close(): Promise<void> { try { await this.appWindow?.close(); } catch { /* Window closed. */ } }

  async revealAndFocus(): Promise<void> {
    // Final-form reminders may need to recover the app from a minimized state.
    try {
      await this.appWindow?.unminimize();
      await this.appWindow?.show();
      await this.appWindow?.center();
      await this.appWindow?.setFocus();
    } catch { /* The desktop window may already be visible. */ }
  }
}
