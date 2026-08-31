import type { SessionLog, SessionUpdate } from "$lib/features/activity/types";
import { formatClock, phaseDurationSeconds, timerProgress } from "./timer";
import type { Phase, TimerConfig } from "./types";

export type TimerTickResult = {
  // The controller performs audio side effects; the store only requests them.
  playFocusTick: boolean;
  // Present when this tick completed or updated a session record.
  session?: SessionUpdate;
};

/**
 * Owns the focus/break state machine and elapsed-time accounting.
 * It does not persist data, play audio, or know why a tick may be blocked.
 */
export class TimerStore {
  // `secondsLeft` counts down; overtime has a separate upward counter.
  phase = $state<Phase>("focus");
  secondsLeft = $state(25 * 60);
  overtimeSeconds = $state(0);
  running = $state(false);
  phaseElapsedSeconds = $state(0);
  // Prevents a completed focus from being counted again on every overtime tick.
  phaseCompletionLogged = $state(false);

  get isOvertime() { return this.phase === "focus" && this.secondsLeft === 0; }
  get displayTime() {
    const clock = formatClock(this.isOvertime ? this.overtimeSeconds : this.secondsLeft);
    return this.isOvertime && this.overtimeSeconds > 0 ? `+${clock}` : clock;
  }

  progress(config: TimerConfig): number {
    return this.isOvertime ? 1 : timerProgress(this.secondsLeft, this.phase, config);
  }

  indicatorLabel(isAllowed: boolean): string {
    if (!this.running) return "IDLE";
    if (this.phase === "break") return "BREAK";
    if (!isAllowed) return "FOCUS PAUSED";
    if (this.isOvertime) return "OVERTIME";
    return "FOCUS";
  }

  start(): void { this.running = true; }
  pause(): void { this.running = false; }

  reset(config: TimerConfig): void {
    // A full reset always returns to a fresh, stopped focus phase.
    this.running = false;
    this.phase = "focus";
    this.secondsLeft = phaseDurationSeconds("focus", config);
    this.overtimeSeconds = 0;
    this.phaseElapsedSeconds = 0;
    this.phaseCompletionLogged = false;
  }

  syncDuration(phase: Phase, minutes: number): void {
    // Never jump a running countdown when the user edits future durations.
    if (!this.running && this.phase === phase) this.secondsLeft = minutes * 60;
  }

  tick(config: TimerConfig): TimerTickResult {
    if (!this.running) return { playFocusTick: false };
    const playFocusTick = this.phase === "focus";

    if (this.secondsLeft > 0) {
      this.phaseElapsedSeconds += 1;
      this.secondsLeft -= 1;
      return { playFocusTick };
    }

    if (this.phase === "focus" && config.overtimeEnabled) {
      // Log completion once at 00:00, then keep the same session open for overtime.
      let session: SessionUpdate | undefined;
      if (!this.phaseCompletionLogged) {
        this.phaseCompletionLogged = true;
        session = {
          log: this.createLog("focus", true, config),
          replaceLatest: false,
          incrementsCompletedFocuses: true
        };
      }
      this.phaseElapsedSeconds += 1;
      this.overtimeSeconds += 1;
      return { playFocusTick, session };
    }

    return { playFocusTick, session: this.finishPhase(true, config) };
  }

  stop(config: TimerConfig): SessionUpdate | undefined {
    const hasSession =
      this.running ||
      this.phaseElapsedSeconds > 0 ||
      this.overtimeSeconds > 0 ||
      this.phaseCompletionLogged;

    const session = hasSession
      ? this.finishPhase(true, config)
      : undefined;

    this.running = false;
    return session;
  }

  private finishPhase(completed: boolean, config: TimerConfig): SessionUpdate {
    const finishedPhase = this.phase;
    // Overtime already created the completed focus entry at 00:00. Replace that
    // entry with its final overtime duration instead of adding a duplicate.
    const replaceLatest = this.phaseCompletionLogged && finishedPhase === "focus";
    const log = this.createLog(finishedPhase, replaceLatest ? true : completed, config);
    const update: SessionUpdate = {
      log,
      replaceLatest,
      incrementsCompletedFocuses: finishedPhase === "focus" && completed && !this.phaseCompletionLogged
    };

    // Phase transitions are centralized here so stop, skip, and natural completion agree.
    this.phase = finishedPhase === "focus" ? "break" : "focus";
    this.secondsLeft = phaseDurationSeconds(this.phase, config);
    this.overtimeSeconds = 0;
    this.phaseElapsedSeconds = 0;
    this.phaseCompletionLogged = false;
    return update;
  }

  private createLog(phase: Phase, completed: boolean, config: TimerConfig): SessionLog {
    return {
      phase,
      completed,
      endedAt: Date.now(),
      minutes: phase === "focus" ? config.focusMinutes : config.breakMinutes,
      overtimeSeconds: this.overtimeSeconds,
      actualSeconds: this.phaseElapsedSeconds
    };
  }
}
