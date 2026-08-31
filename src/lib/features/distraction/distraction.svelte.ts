import type { WatchMode } from "$lib/features/settings/types";
import { isTitleAllowed } from "./rules";

export type DistractionConfig = {
  growthEvery: number;
  minimizeAfter: number;
  finalPopEvery: number;
};

export type DistractionActions = {
  // The store describes native actions; NibblesApp decides how to perform them.
  popFinalForm: boolean;
  minimizeForeground: boolean;
};

/** Tracks foreground-window eligibility and the creature's warning escalation. */
export class DistractionStore {
  // Foreground-window state shown in the settings panel and warning banner.
  activeTitle = $state("Waiting for a window…");
  lastExternalTitle = $state("");
  isAllowed = $state(true);
  // Elapsed blocked-window time (sometimes thought of as a "distraction score").
  // It resets to zero when focus returns and determines the current warning stage.
  seconds = $state(0);
  stage = $state(0);
  previewStage = $state(0);
  detectionSupported = $state(true);
  // Internal guards are intentionally non-reactive because the UI never renders them.
  private minimizedThisDistraction = false;
  private finalFormSeconds = 0;
  private previewTimeout: ReturnType<typeof setTimeout> | null = null;

  get effectiveStage() { return Math.max(this.stage, this.previewStage); }
  get creatureSource() {
    return this.effectiveStage === 0 ? "/form1_.png?v=figma-forms-2"
      : this.effectiveStage === 1 ? "/form2.png?v=figma-forms-2"
      : this.effectiveStage === 2 ? "/form3.png?v=figma-forms-2"
      : "/form4.png?v=figma-forms-2";
  }
  get warningLabel() {
    if (this.stage === 3) return "LAST WARNING · RETURN TO YOUR RITUAL";
    if (this.stage === 2) return "SECOND WARNING · IT IS STILL GROWING";
    return "DISTRACTION DETECTED · TIMER FROZEN";
  }

  applyForegroundTitle(title: string, supported: boolean, monitorActive: boolean, mode: WatchMode, rules: string[]): void {
    this.detectionSupported = supported;
    if (!supported) {
      this.isAllowed = true;
      this.clear();
      return;
    }

    // Focusing Nibbles must not clear an existing warning; otherwise opening the
    // widget itself would become a loophole that resets distraction progress.
    const ownWindow = title.toLocaleLowerCase().includes("nibbles");
    if (ownWindow && monitorActive) return;
    if (ownWindow) {
      this.isAllowed = true;
      return;
    }

    this.activeTitle = title || "Untitled window";
    if (title) this.lastExternalTitle = title;
    const nextAllowed = isTitleAllowed(title, mode, rules);
    if (nextAllowed && !this.isAllowed) this.clear();
    // Enter stage one immediately on the allowed -> distracting transition.
    if (!nextAllowed && this.isAllowed && monitorActive) {
      this.stage = 1;
      this.seconds = 0;
      this.minimizedThisDistraction = false;
    }
    this.isAllowed = nextAllowed;
  }

  reevaluate(mode: WatchMode, rules: string[]): void {
    this.isAllowed = isTitleAllowed(this.activeTitle, mode, rules);
  }

  advance(config: DistractionConfig): DistractionActions {
    // Stages 1-3 are derived from elapsed distraction time and the growth interval.
    this.seconds += 1;
    this.stage = Math.min(3, 1 + Math.floor((this.seconds - 1) / config.growthEvery));
    let popFinalForm = false;
    let minimizeForeground = false;

    if (this.stage === 3) {
      this.finalFormSeconds += 1;
      // -1 means "reuse the growth interval"; 0 disables repeated pop-ups.
      const popupInterval = config.finalPopEvery === -1 ? config.growthEvery : config.finalPopEvery;
      popFinalForm = popupInterval > 0 && this.finalFormSeconds % popupInterval === 0;
    } else {
      this.finalFormSeconds = 0;
    }

    if (this.stage === 3 && config.minimizeAfter > 0 && this.finalFormSeconds >= config.minimizeAfter && !this.minimizedThisDistraction) {
      this.minimizedThisDistraction = true;
      minimizeForeground = true;
    }
    return { popFinalForm, minimizeForeground };
  }

  clear(): void {
    // Clearing also resets one-shot native actions for the next distraction.
    this.seconds = 0;
    this.stage = 0;
    this.finalFormSeconds = 0;
    this.minimizedThisDistraction = false;
  }

  preview(stage: number, onReset?: () => void): void {
    // Preview state temporarily overrides the real stage but never changes monitoring.
    this.resetPreview();
    this.previewStage = stage;
    if (stage > 0) this.previewTimeout = setTimeout(() => {
      this.resetPreview();
      onReset?.();
    }, 3000);
  }

  resetPreview(): void {
    if (this.previewTimeout) clearTimeout(this.previewTimeout);
    this.previewTimeout = null;
    this.previewStage = 0;
  }

  dispose(): void { this.resetPreview(); }
}
