import { buildTrendDays, trendChange } from "./statistics";
import type { ActivityData, LogFilter, SessionLog, SessionUpdate } from "./types";

/** Owns session history, the selected log filter, and chart-ready summaries. */
export class ActivityStore {
  // History is capped when recording/migrating so these derived getters stay inexpensive.
  completedFocuses = $state(0);
  sessionLogs = $state<SessionLog[]>([]);
  logFilter = $state<LogFilter>("all");

  // Getters remain reactive because they read Svelte $state fields.
  get trendDays() { return buildTrendDays(this.sessionLogs); }
  get trendMaximum() { return Math.max(1, ...this.trendDays.flatMap((day) => [day.focusMinutes, day.breakMinutes])); }
  get weekFocusMinutes() { return this.trendDays.reduce((total, day) => total + day.focusMinutes, 0); }
  get weekBreakMinutes() { return this.trendDays.reduce((total, day) => total + day.breakMinutes, 0); }
  get weekLogs() { return this.sessionLogs.filter((log) => log.endedAt >= this.trendDays[0].key); }
  get weekFocusLogs() { return this.weekLogs.filter((log) => log.phase === "focus"); }
  get weekCompletedFocuses() { return this.weekFocusLogs.filter((log) => log.completed).length; }
  get weekCompletionRate() { return this.weekFocusLogs.length ? Math.round(this.weekCompletedFocuses / this.weekFocusLogs.length * 100) : 0; }
  get averageFocusMinutes() { return this.weekCompletedFocuses ? Math.round(this.weekFocusMinutes / this.weekCompletedFocuses) : 0; }
  get trendChange() { return trendChange(this.trendDays); }
  get filteredLogs() { return this.sessionLogs.filter((log) => this.logFilter === "all" || log.phase === this.logFilter).slice(0, 12); }

  record(update: SessionUpdate): void {
    // Overtime first logs at 00:00, then replaces that newest entry when it ends.
    if (update.replaceLatest) {
      const [latest, ...remaining] = this.sessionLogs;
      if (latest?.phase === "focus" && latest.completed) this.sessionLogs = [update.log, ...remaining];
    } else {
      this.sessionLogs = [update.log, ...this.sessionLogs].slice(0, 100);
    }
    if (update.incrementsCompletedFocuses) this.completedFocuses += 1;
  }

  hydrate(activity: ActivityData): void {
    // Input has already been validated by the persistence migration.
    this.completedFocuses = activity.completedFocuses;
    this.sessionLogs = [...activity.sessionLogs];
  }

  snapshot(): ActivityData {
    return { completedFocuses: this.completedFocuses, sessionLogs: [...this.sessionLogs] };
  }
}
