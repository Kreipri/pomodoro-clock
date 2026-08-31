import type { WatchMode } from "$lib/features/settings/types";
import { isTitleAllowed } from "./rules";

export type DistractionConfig = {
  growthEvery: number;
  minimizeAfter: number;
  finalPopEvery: number;
};

export type DistractionActions = {
  popFinalForm: boolean;
  minimizeForeground: boolean;
};

export class DistractionStore {
  activeTitle = $state("Waiting for a window…");
  lastExternalTitle = $state("");
  isAllowed = $state(true);
  seconds = $state(0);
  stage = $state(0);
  previewStage = $state(0);
  detectionSupported = $state(true);
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
    this.seconds += 1;
    this.stage = Math.min(3, 1 + Math.floor((this.seconds - 1) / config.growthEvery));
    let popFinalForm = false;
    let minimizeForeground = false;

    if (this.stage === 3) {
      this.finalFormSeconds += 1;
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
    this.seconds = 0;
    this.stage = 0;
    this.finalFormSeconds = 0;
    this.minimizedThisDistraction = false;
  }

  preview(stage: number, onReset?: () => void): void {
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
