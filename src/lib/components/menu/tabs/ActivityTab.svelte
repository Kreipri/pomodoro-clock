<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import {
    formatDuration,
    formatLogTime,
    formatTrendMinutes,
    sessionDurationSeconds
  } from "$lib/features/activity/statistics";
  import type { LogFilter, SessionLog, TrendDay } from "$lib/features/activity/types";

  /** The activity store calculates statistics; this tab only presents them. */
  type Props = {
    trendChange: number;
    trendDays: TrendDay[];
    trendMaximum: number;
    weekFocusMinutes: number;
    weekBreakMinutes: number;
    weekCompletedFocuses: number;
    weekSessionCount: number;
    averageFocusMinutes: number;
    weekCompletionRate: number;
    logFilter: LogFilter;
    filteredLogs: SessionLog[];
    totalLogCount: number;
    onFilterChange: (filter: LogFilter) => void;
  };

  let {
    trendChange,
    trendDays,
    trendMaximum,
    weekFocusMinutes,
    weekBreakMinutes,
    weekCompletedFocuses,
    weekSessionCount,
    averageFocusMinutes,
    weekCompletionRate,
    logFilter,
    filteredLogs,
    totalLogCount,
    onFilterChange
  }: Props = $props();

  /** Select one shared icon for the week-over-week direction. */
  const trendIcon = $derived(
    trendChange > 0
      ? "trend-up"
      : trendChange < 0
        ? "trend-down"
        : "trend-flat"
  );

  /** Preserve a small visible bar for short, non-zero sessions. */
  function barHeight(minutes: number) {
    return minutes > 0 ? Math.max(4, (minutes / trendMaximum) * 100) : 0;
  }
</script>

<div class="menu-view" id="activity-view" role="tabpanel" aria-label="Focus activity">
  <!-- Seven-day direction and headline statistics. -->
  <div class="section-heading activity-heading">
    <div>
      <p class="section-kicker">LAST 7 DAYS</p>
      <h2>Your week</h2>
    </div>

    <span
      class="trend-change"
      class:trend-up={trendChange > 0}
      class:trend-down={trendChange < 0}
      title="Recent three days compared with the prior three days"
    >
      <Icon name={trendIcon} />
      {Math.abs(trendChange)}%
    </span>
  </div>

  <div class="activity-summary" aria-label="Seven-day totals and averages">
    <div>
      <span>Focus</span>
      <strong>{formatTrendMinutes(weekFocusMinutes)}</strong>
    </div>
    <div>
      <span>Break</span>
      <strong>{formatTrendMinutes(weekBreakMinutes)}</strong>
    </div>
    <div>
      <span>Fed</span>
      <strong>{weekCompletedFocuses}</strong>
    </div>
    <div>
      <span>Sessions</span>
      <strong>{weekSessionCount}</strong>
    </div>
    <div>
      <span>Avg focus</span>
      <strong>{averageFocusMinutes}m</strong>
    </div>
    <div>
      <span>Completion</span>
      <strong>{weekCompletionRate}%</strong>
    </div>
  </div>

  <!-- Both bar types use the same maximum so their heights are comparable. -->
  <div
    class="trend-chart"
    role="img"
    aria-label={`Seven-day chart: ${formatTrendMinutes(
      weekFocusMinutes
    )} focused and ${formatTrendMinutes(weekBreakMinutes)} on breaks`}
  >
    {#each trendDays as day}
      <div class="trend-day">
        <div class="bar-pair">
          <!-- Bar height is the only data-driven inline style in this view. -->
          <span
            class="focus-bar"
            title={`${formatTrendMinutes(day.focusMinutes)} focus`}
            style:height={`${barHeight(day.focusMinutes)}%`}
          ></span>
          <span
            class="break-bar"
            title={`${formatTrendMinutes(day.breakMinutes)} break`}
            style:height={`${barHeight(day.breakMinutes)}%`}
          ></span>
        </div>
        <small>{day.label}</small>
      </div>
    {/each}
  </div>

  <div class="trend-legend" aria-hidden="true">
    <span><i class="focus-key"></i>Focus</span>
    <span><i class="break-key"></i>Break</span>
  </div>

  <!-- Filter controls and the latest matching session records. -->
  <div class="session-heading">
    <h3>Sessions</h3>
    <div class="log-filters" role="group" aria-label="Filter sessions">
      <button
        class:active={logFilter === "all"}
        onclick={() => onFilterChange("all")}
        aria-label="Show all sessions"
        aria-pressed={logFilter === "all"}
        title="All sessions"
      >
        <Icon name="list" />
      </button>
      <button
        class:active={logFilter === "focus"}
        onclick={() => onFilterChange("focus")}
        aria-label="Show focus sessions"
        aria-pressed={logFilter === "focus"}
        title="Focus sessions"
      >
        <Icon name="focus" />
      </button>
      <button
        class:active={logFilter === "break"}
        onclick={() => onFilterChange("break")}
        aria-label="Show break sessions"
        aria-pressed={logFilter === "break"}
        title="Break sessions"
      >
        <Icon name="break" />
      </button>
    </div>
  </div>

  {#if filteredLogs.length === 0}
    <div class="empty-log">
      <Icon name="clock" />
      <p>
        {totalLogCount === 0
          ? "Complete or skip a ritual and it will appear here."
          : "No sessions match this filter yet."}
      </p>
    </div>
  {:else}
    <ol class="log-list">
      {#each filteredLogs as log}
        <li>
          <span
            class="log-icon"
            class:focus={log.phase === "focus"}
            class:break={log.phase === "break"}
            aria-hidden="true"
          >
            <Icon name={log.phase === "focus" ? "focus" : "break"} />
          </span>

          <span class="log-copy">
            <strong>{log.phase === "focus" ? "Focus" : "Break"}</strong>
            <small>
              {log.completed ? "Completed" : "Skipped"}
              {log.overtimeSeconds > 0
                ? ` · +${Math.ceil(log.overtimeSeconds / 60)}m flow`
                : ""}
              · {formatLogTime(log.endedAt)}
            </small>
          </span>

          <time datetime={new Date(log.endedAt).toISOString()}>
            {formatDuration(sessionDurationSeconds(log))}
          </time>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .menu-view {
    width: 100%;
    padding: 0.625rem 0 0.375rem;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .activity-heading {
    align-items: flex-end;
    margin-bottom: 0.6875rem;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 600;
  }

  .section-kicker {
    margin: 0 0 0.125rem;
    color: #9a7b82;
    font-size: 0.55rem;
    font-weight: 850;
    letter-spacing: 0.13em;
  }

  .trend-change {
    display: inline-flex;
    align-items: center;
    gap: 0.1875rem;
    padding: 0.25rem 0.4375rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.035);
    color: #a99497;
    font-size: 0.62rem;
    font-weight: 800;
  }

  .trend-change :global(svg) {
    font-size: 0.75rem;
  }

  .trend-change.trend-up {
    border-color: rgba(127, 178, 139, 0.14);
    background: rgba(81, 135, 96, 0.1);
    color: #8dc39a;
  }

  .trend-change.trend-down {
    border-color: rgba(229, 87, 111, 0.15);
    background: rgba(155, 38, 61, 0.11);
    color: #f06a7e;
  }

  .activity-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3125rem;
    margin-bottom: 0.5625rem;
  }

  .activity-summary div {
    padding: 0.4375rem 0.5rem 0.375rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 0.6875rem;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.035),
      rgba(0, 0, 0, 0.07)
    );
  }

  .activity-summary span,
  .activity-summary strong {
    display: block;
  }

  .activity-summary span {
    margin-bottom: 0.125rem;
    color: #a28c90;
    font-size: 0.64rem;
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .activity-summary strong {
    overflow: hidden;
    color: #f0ddda;
    font-family: var(--font-display);
    font-size: 1.02rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trend-chart {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    height: 7.75rem;
    padding: 0.5625rem 0.5rem 0.1875rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.8125rem;
    background:
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 1.6875rem,
        rgba(255, 255, 255, 0.035) 1.75rem
      ),
      rgba(0, 0, 0, 0.13);
  }

  .trend-day {
    display: grid;
    grid-template-rows: 1fr 0.8125rem;
    min-width: 0;
    text-align: center;
  }

  .bar-pair {
    display: flex;
    min-height: 0;
    align-items: flex-end;
    justify-content: center;
    gap: 0.1875rem;
  }

  .bar-pair > span {
    display: block;
    width: 0.4375rem;
    min-height: 0;
    border-radius: 0.3125rem 0.3125rem 0.125rem 0.125rem;
    transition: height 240ms ease;
  }

  .focus-bar {
    background: linear-gradient(to top, #8e2444, #ff6077);
    box-shadow: 0 0 0.5625rem rgba(240, 66, 94, 0.2);
  }

  .break-bar {
    background: linear-gradient(to top, #526d65, #91b8a7);
    opacity: 0.8;
  }

  .trend-day small {
    align-self: end;
    color: #927d82;
    font-size: 0.56rem;
    font-weight: 700;
  }

  .trend-legend {
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
    margin: 0.3125rem 0.125rem 0.75rem;
    color: #958084;
    font-size: 0.56rem;
  }

  .trend-legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .trend-legend i {
    width: 0.3125rem;
    height: 0.3125rem;
    border-radius: 50%;
  }

  .trend-legend .focus-key {
    background: #ed4e68;
    box-shadow: 0 0 0.3125rem rgba(237, 78, 104, 0.35);
  }

  .trend-legend .break-key {
    background: #87ad9e;
  }

  .session-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4375rem;
  }

  .session-heading h3 {
    margin: 0;
    color: #d9c1bf;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
  }

  .log-filters {
    display: flex;
    gap: 0.25rem;
    padding: 0.1875rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.2);
  }

  .log-filters button {
    display: grid;
    width: 1.5625rem;
    height: 1.5625rem;
    padding: 0;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 50%;
    background: transparent;
    color: #77636a;
    font-size: 0.875rem;
    transition: var(--transition-fast);
  }

  .log-filters button:hover,
  .log-filters button:focus-visible {
    color: #e4c9c8;
  }

  .log-filters button.active {
    border-color: rgba(245, 111, 129, 0.22);
    background: linear-gradient(
      145deg,
      rgba(137, 37, 61, 0.75),
      rgba(61, 15, 38, 0.78)
    );
    color: #fff0eb;
    box-shadow: 0 0.1875rem 0.625rem rgba(42, 6, 22, 0.28);
  }

  .empty-log {
    display: flex;
    min-height: 3.625rem;
    align-items: center;
    justify-content: center;
    gap: 0.5625rem;
    padding: 0.5625rem 0.75rem;
    border: 1px dashed rgba(255, 255, 255, 0.065);
    border-radius: 0.6875rem;
    color: #705e64;
  }

  .empty-log :global(svg) {
    flex: 0 0 auto;
    font-size: 1.1875rem;
  }

  .empty-log p {
    max-width: 16.25rem;
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .log-list {
    display: grid;
    max-height: 18.75rem;
    gap: 0.3125rem;
    margin: 0;
    padding: 0 0.1875rem 0 0;
    overflow: auto;
    list-style: none;
    scrollbar-color: #5f2940 transparent;
    scrollbar-width: thin;
  }

  .log-list li {
    display: grid;
    grid-template-columns: 1.9375rem minmax(0, 1fr) auto;
    min-height: 2.6875rem;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3125rem 0.5rem 0.3125rem 0.3125rem;
    border: 1px solid rgba(255, 255, 255, 0.045);
    border-radius: 0.6875rem;
    background: rgba(255, 255, 255, 0.022);
  }

  .log-icon {
    display: grid;
    width: 1.8125rem;
    height: 1.8125rem;
    place-items: center;
    border-radius: 0.5625rem;
    font-size: 0.875rem;
  }

  .log-icon.focus {
    background: rgba(168, 38, 65, 0.15);
    color: #f45d75;
  }

  .log-icon.break {
    background: rgba(95, 137, 123, 0.14);
    color: #91bbaa;
  }

  .log-copy {
    min-width: 0;
  }

  .log-copy strong,
  .log-copy small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .log-copy strong {
    color: #d9c0be;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .log-copy small {
    margin-top: 0.125rem;
    color: #927c81;
    font-size: 0.66rem;
  }

  .log-list time {
    color: #b99da1;
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
  }
</style>
