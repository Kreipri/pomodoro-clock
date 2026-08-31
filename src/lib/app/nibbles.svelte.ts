import { ActivityStore } from "$lib/features/activity/activity.svelte";
import { DistractionStore } from "$lib/features/distraction/distraction.svelte";
import type { RitualSettingsPatch, SoundSettingsPatch, WatchMode } from "$lib/features/settings/types";
import { SettingsStore } from "$lib/features/settings/settings.svelte";
import { TimerStore } from "$lib/features/timer/timer.svelte";
import type { Phase } from "$lib/features/timer/types";
import type { LogFilter } from "$lib/features/activity/types";
import type { MenuView } from "$lib/types";
import { AudioEngine } from "$lib/services/audio/audio-engine";
import { DesktopWindowService } from "$lib/services/desktop/desktop-window";
import { ForegroundMonitor } from "$lib/services/desktop/foreground-monitor";
import { loadAppState, saveAppState } from "$lib/services/persistence/settings-storage";

/**
 * Application coordinator.
 *
 * Feature stores own their state and rules; services own browser/Tauri side effects.
 * This class is the only place that connects them (for example, a distraction
 * pauses timer progress and may ask the desktop service to resize the window).
 * Keep rendering in +page.svelte and avoid putting feature calculations here.
 */
export class NibblesApp {
  // Long-lived feature stores. Svelte components read their reactive fields directly.
  readonly settings = new SettingsStore();
  readonly timer = new TimerStore();
  readonly activity = new ActivityStore();
  readonly distraction = new DistractionStore();

  // Small pieces of application-shell state that do not belong to one feature.
  settingsOpen = $state(false);
  menuView = $state<MenuView>("activity");
  ambientPreviewing = $state(false);
  pinned = $state(true);

  // Side-effect adapters. Replacing one of these should not require UI changes.
  private readonly audio = new AudioEngine();
  private readonly desktop = new DesktopWindowService();
  private readonly foreground = new ForegroundMonitor();
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private audioPreviewTimeout: ReturnType<typeof setTimeout> | null = null;
  // These values prevent expensive resize-and-center calls on every one-second tick.
  private lastWindowStage = -1;
  private lastMenuOpen = false;

  // Read-only values assembled from more than one feature for the UI.
  get monitorActive() { return this.timer.running && this.timer.phase === "focus"; }
  get timerProgress() { return this.timer.progress(this.settings.timerConfig); }
  get indicatorLabel() { return this.timer.indicatorLabel(this.distraction.isAllowed); }
  get showBook() { return this.timer.running && this.timer.phase === "focus" && this.distraction.isAllowed && this.distraction.effectiveStage === 0; }

  async initialize(): Promise<void> {
    // Hydrate before starting intervals so the first tick uses the user's durations.
    const snapshot = loadAppState();
    this.settings.hydrate(snapshot.settings);
    this.activity.hydrate(snapshot.activity);
    this.timer.reset(this.settings.timerConfig);
    this.pinned = await this.desktop.isPinned();
    // Timer cadence and foreground polling intentionally differ: window changes
    // should be detected quickly, while productive time advances once per second.
    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.monitorInterval = setInterval(() => void this.pollForegroundWindow(), 600);
    await this.pollForegroundWindow();
    this.syncWindowState(true);
    this.syncWindowTitle();
  }

  dispose(): void {
    // Every interval, timeout, and audio node created by the app must end here.
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    if (this.audioPreviewTimeout) clearTimeout(this.audioPreviewTimeout);
    this.timerInterval = null;
    this.monitorInterval = null;
    this.audioPreviewTimeout = null;
    this.distraction.dispose();
    this.audio.dispose();
  }

  // Public commands are arrow properties so `this` remains bound when a component
  // receives one directly as a callback prop.
  toggleTimer = (): void => {
    this.distraction.resetPreview();
    if (this.timer.running) this.pauseTimer();
    else {
      this.timer.start();
      void this.audio.unlock();
      this.syncAmbientAudio();
      this.syncWindowState();
      this.syncWindowTitle();
    }
  };

  stopTimer = (): void => {
    // Stopping may produce a partial session, unlike merely pausing the timer.
    const session = this.timer.stop(this.settings.timerConfig);
    if (session) this.activity.record(session);
    this.distraction.isAllowed = true;
    this.distraction.clear();
    this.persist();
    this.syncAmbientAudio();
    this.syncWindowState();
    this.syncWindowTitle();
  };

  skipPhase = (): void => {
    // TimerStore decides whether a zero-second phase counts as completed.
    this.activity.record(this.timer.skip(this.settings.timerConfig));
    this.distraction.clear();
    this.persist();
    this.syncAmbientAudio();
    this.syncWindowState();
    this.syncWindowTitle();
  };

  setWatchMode = (mode: WatchMode): void => {
    // Re-evaluate immediately so the UI does not wait for the next monitor poll.
    this.settings.setWatchMode(mode);
    this.distraction.reevaluate(mode, this.settings.rules);
    this.distraction.clear();
    this.persist();
    this.syncWindowState();
  };

  addRule = (rule: string): void => {
    this.settings.addRule(rule);
    this.distraction.reevaluate(this.settings.watchMode, this.settings.rules);
    this.persist();
  };

  removeRule = (rule: string): void => {
    this.settings.removeRule(rule);
    this.distraction.reevaluate(this.settings.watchMode, this.settings.rules);
    this.persist();
  };

  useObservedWindow = (): void => {
    if (this.distraction.lastExternalTitle) this.addRule(this.distraction.lastExternalTitle);
  };

  updateDuration = (phase: Phase, minutes: number): void => {
    // Settings validates the input; TimerStore updates its display only when idle.
    const safeValue = this.settings.updateDuration(phase, minutes);
    this.timer.syncDuration(phase, safeValue);
    this.persist();
    this.syncWindowTitle();
  };

  updateRitualSettings = (patch: RitualSettingsPatch): void => {
    this.settings.patchRitual(patch);
    this.persist();
  };

  updateSoundSettings = (patch: SoundSettingsPatch): void => {
    this.settings.patchSound(patch);
    this.persist();
    this.syncAmbientAudio();
  };

  setLogFilter = (filter: LogFilter): void => { this.activity.logFilter = filter; };
  setMenuView = (view: MenuView): void => { this.menuView = view; };

  toggleSettings = (): void => {
    // Opening the menu always starts on activity, matching the primary menu action.
    this.settingsOpen = !this.settingsOpen;
    if (this.settingsOpen) this.menuView = "activity";
    this.distraction.resetPreview();
    this.syncWindowState();
  };

  previewForm = (stage: number): void => {
    // The menu closes so the selected creature form has the full window to render.
    this.settingsOpen = false;
    this.distraction.preview(stage, () => this.syncWindowState());
    this.syncWindowState();
  };

  previewTick = (): void => {
    void this.audio.playTick(this.settings.tickStyle, this.settings.soundVolume);
  };

  toggleAmbientPreview = async (): Promise<void> => {
    // A preview self-terminates so an unattended settings panel cannot play forever.
    if (this.audioPreviewTimeout) clearTimeout(this.audioPreviewTimeout);
    this.audioPreviewTimeout = null;
    if (this.ambientPreviewing) {
      this.ambientPreviewing = false;
      this.syncAmbientAudio();
      return;
    }
    await this.audio.unlock();
    this.ambientPreviewing = true;
    this.syncAmbientAudio();
    this.audioPreviewTimeout = setTimeout(() => {
      this.ambientPreviewing = false;
      this.audioPreviewTimeout = null;
      this.syncAmbientAudio();
    }, 12000);
  };

  togglePinned = async (): Promise<void> => {
    this.pinned = !this.pinned;
    await this.desktop.setPinned(this.pinned);
  };

  startDragging = (event: PointerEvent): void => { void this.desktop.startDragging(event); };
  minimize = (): void => { void this.desktop.minimize(); };
  close = (): void => { void this.desktop.close(); };

  private pauseTimer(): void {
    // Pausing also dismisses warning state; monitoring resumes from a clean state.
    this.timer.pause();
    this.distraction.isAllowed = true;
    this.distraction.clear();
    this.syncAmbientAudio();
    this.syncWindowState();
    this.syncWindowTitle();
  }

  private tick(): void {
    if (!this.timer.running) return;

    // Distraction time advances independently while productive time is frozen.
    if (this.timer.phase === "focus" && !this.distraction.isAllowed) {
      const actions = this.distraction.advance(this.settings);
      if (actions.popFinalForm) void this.desktop.revealAndFocus();
      if (actions.minimizeForeground) void this.foreground.minimizeIfUnchanged(this.distraction.activeTitle);
      this.syncWindowState();
      this.syncWindowTitle();
      return;
    }

    // Returning to an allowed window resets the escalation before time advances.
    if (this.timer.phase === "focus") this.distraction.clear();
    const result = this.timer.tick(this.settings.timerConfig);
    if (result.playFocusTick && this.settings.tickEnabled) void this.audio.playTick(this.settings.tickStyle, this.settings.soundVolume);
    if (result.session) {
      this.activity.record(result.session);
      this.persist();
    }
    this.syncAmbientAudio();
    this.syncWindowState();
    this.syncWindowTitle();
  }

  private async pollForegroundWindow(): Promise<void> {
    // The service returns a safe unsupported result in browser preview mode.
    const result = await this.foreground.read();
    this.distraction.applyForegroundTitle(result.title, result.supported, this.monitorActive, this.settings.watchMode, this.settings.rules);
    this.syncWindowState();
  }

  private persist(): void {
    // Persist feature snapshots, never live store instances or Svelte proxies.
    saveAppState(this.settings.snapshot(), this.activity.snapshot());
  }

  private syncAmbientAudio(): void {
    // Break playback and the manual preview share one ambient engine.
    const shouldPlay = (this.timer.running && this.timer.phase === "break" && this.settings.breakMusicEnabled) || this.ambientPreviewing;
    void this.audio.syncAmbient(shouldPlay, this.settings.ambientStyle, this.settings.soundVolume);
  }

  private syncWindowTitle(): void {
    void this.desktop.setTitle(`${this.timer.displayTime} · ${this.indicatorLabel} · Nibbles`);
  }

  private syncWindowState(force = false): void {
    const stage = this.distraction.effectiveStage;
    // Resizing also centers the Tauri window, so only do it when layout state changes.
    if (!force && stage === this.lastWindowStage && this.settingsOpen === this.lastMenuOpen) return;
    this.lastWindowStage = stage;
    this.lastMenuOpen = this.settingsOpen;
    void this.desktop.applyLayoutState(stage, this.settingsOpen);
  }
}
