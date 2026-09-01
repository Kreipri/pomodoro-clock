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
    averageFocusMinutes: number;
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
    averageFocusMinutes,
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
    <article class="stat-card focus-stat">
      <span class="stat-icon" aria-hidden="true"><Icon name="focus" /></span>
      <span class="stat-copy">
        <small>FOCUS TIME</small>
        <strong>{formatTrendMinutes(weekFocusMinutes)}</strong>
        <span>Seven-day total</span>
      </span>
    </article>

    <article class="stat-card break-stat">
      <span class="stat-icon" aria-hidden="true"><Icon name="break" /></span>
      <span class="stat-copy">
        <small>BREAK TIME</small>
        <strong>{formatTrendMinutes(weekBreakMinutes)}</strong>
        <span>Recovery time</span>
      </span>
    </article>

    <article class="stat-card average-stat">
      <span class="stat-icon" aria-hidden="true"><Icon name="clock" /></span>
      <span class="stat-copy">
        <small>AVERAGE FOCUS</small>
        <strong>{averageFocusMinutes}m</strong>
        <span>Per completed focus</span>
      </span>
    </article>
  </div>

  <!-- Both bar types use the same maximum so their heights are comparable. -->
  <section class="chart-card">
    <header class="chart-heading">
      <div>
        <p>DAILY RHYTHM</p>
        <h3>Focus and recovery</h3>
      </div>
      <div class="trend-legend" aria-hidden="true">
        <span><i class="focus-key"></i>Focus</span>
        <span><i class="break-key"></i>Break</span>
      </div>
    </header>

    <div
      class="trend-chart"
      role="img"
      aria-label={`Seven-day chart: ${formatTrendMinutes(
        weekFocusMinutes
      )} focused and ${formatTrendMinutes(weekBreakMinutes)} on breaks`}
    >
      {#each trendDays as day}
        <div class="trend-day">
          <small class="day-value">
            {day.focusMinutes > 0 ? formatTrendMinutes(day.focusMinutes) : "—"}
          </small>
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
          <small class="day-label">{day.label}</small>
        </div>
      {/each}
    </div>
  </section>

  <!-- Filter controls and the latest matching session records. -->
  <div class="session-heading">
    <div>
      <p>RECENT HISTORY</p>
      <h3>Sessions</h3>
    </div>
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
            <strong>{log.phase === "focus" ? "Focus session" : "Break session"}</strong>
            <small>
              {formatLogTime(log.endedAt)}
              {log.overtimeSeconds > 0
                ? ` · +${Math.ceil(log.overtimeSeconds / 60)}m flow`
                : ""}
            </small>
          </span>

          <span class="log-result">
            <time datetime={new Date(log.endedAt).toISOString()}>
              {formatDuration(sessionDurationSeconds(log))}
            </time>
            <small class:completed={log.completed}>
              {log.completed ? "Completed" : "Skipped"}
            </small>
          </span>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .menu-view {
    width: 100%;
    padding: 1.15rem 0 0.5rem;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .activity-heading {
    align-items: flex-end;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.45rem;
    font-weight: 650;
    letter-spacing: -0.025em;
  }

  .section-kicker {
    margin: 0 0 0.125rem;
    color: #b4939b;
    font-size: 0.84rem;
    font-weight: 850;
    letter-spacing: 0.13em;
  }

  .trend-change {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.035);
    color: #a99497;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .trend-change :global(svg) {
    font-size: 0.9rem;
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
    gap: 0.65rem;
    margin-bottom: 0.9rem;
  }

  .stat-card {
    display: grid;
    grid-template-columns: 2.75rem minmax(0, 1fr);
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
    padding: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.065);
    border-radius: 1rem;
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.045), rgba(0, 0, 0, 0.08));
    box-shadow: inset 0 1px rgba(255, 255, 255, 0.025);
  }

  .stat-icon {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    place-items: center;
    border-radius: 0.8rem;
    font-size: 1.2rem;
  }

  .focus-stat .stat-icon {
    background: rgba(193, 46, 74, 0.16);
    color: #ff627b;
  }

  .break-stat .stat-icon {
    background: rgba(92, 145, 125, 0.15);
    color: #98c7b4;
  }

  .average-stat .stat-icon {
    background: rgba(181, 131, 79, 0.14);
    color: #d9ae78;
  }

  .stat-copy,
  .stat-copy small,
  .stat-copy strong,
  .stat-copy > span {
    display: block;
    min-width: 0;
  }

  .stat-copy small {
    color: #ac949a;
    font-size: 0.82rem;
    font-weight: 780;
    letter-spacing: 0.09em;
  }

  .stat-copy strong {
    overflow: hidden;
    margin-top: 0.08rem;
    color: #fff0ed;
    font-family: var(--font-display);
    font-size: 1.55rem;
    font-weight: 680;
    letter-spacing: -0.035em;
    line-height: 1.05;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stat-copy > span {
    overflow: hidden;
    margin-top: 0.2rem;
    color: #a18b91;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-card {
    margin-bottom: 1.15rem;
    padding: 1rem 1rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.12);
  }

  .chart-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .chart-heading p,
  .session-heading p {
    margin: 0 0 0.14rem;
    color: #b58a95;
    font-size: 0.82rem;
    font-weight: 780;
    letter-spacing: 0.12em;
  }

  .chart-heading h3 {
    margin: 0;
    color: #dcc8c9;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 650;
  }

  .trend-chart {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    height: 12rem;
    padding: 0.65rem 0.6rem 0.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.055);
    background:
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 1.6875rem,
        rgba(255, 255, 255, 0.035) 1.75rem
      ),
      transparent;
  }

  .trend-day {
    display: grid;
    grid-template-rows: 1.2rem minmax(0, 1fr) 1.25rem;
    min-width: 0;
    text-align: center;
  }

  .bar-pair {
    display: flex;
    min-height: 0;
    align-items: flex-end;
    justify-content: center;
    gap: 0.3rem;
  }

  .bar-pair > span {
    display: block;
    width: 0.6rem;
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
    color: #ad969b;
    font-size: 0.84rem;
    font-weight: 700;
  }

  .trend-day .day-value {
    align-self: start;
    color: #bca3a6;
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
  }

  .trend-day .day-label {
    color: #a58e94;
    font-size: 0.84rem;
    letter-spacing: 0.03em;
  }

  .trend-legend {
    display: flex;
    justify-content: flex-end;
    gap: 0.85rem;
    margin: 0;
    color: #b29ca0;
    font-size: 0.86rem;
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
    margin-bottom: 0.75rem;
  }

  .session-heading h3 {
    margin: 0;
    color: #d9c1bf;
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 650;
  }

  .log-filters {
    display: flex;
    gap: 0.3rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.2);
  }

  .log-filters button {
    display: grid;
    width: 2rem;
    height: 2rem;
    padding: 0;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 50%;
    background: transparent;
    color: #77636a;
    font-size: 1rem;
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
    min-height: 5rem;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border: 1px dashed rgba(255, 255, 255, 0.065);
    border-radius: 0.6875rem;
    color: #a08a90;
  }

  .empty-log :global(svg) {
    flex: 0 0 auto;
    font-size: 1.4rem;
  }

  .empty-log p {
    max-width: 16.25rem;
    margin: 0;
    font-size: 0.96rem;
    line-height: 1.5;
  }

  .log-list {
    display: grid;
    max-height: none;
    gap: 0.45rem;
    margin: 0;
    padding: 0 0.1875rem 0 0;
    overflow: auto;
    list-style: none;
    scrollbar-color: #5f2940 transparent;
    scrollbar-width: thin;
  }

  .log-list li {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr) auto;
    min-height: 3.35rem;
    align-items: center;
    gap: 0.7rem;
    padding: 0.45rem 0.75rem 0.45rem 0.45rem;
    border: 1px solid rgba(255, 255, 255, 0.045);
    border-radius: 0.8rem;
    background: rgba(255, 255, 255, 0.028);
    transition: var(--transition-fast);
  }

  .log-list li:hover {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.045);
  }

  .log-icon {
    display: grid;
    width: 2.35rem;
    height: 2.35rem;
    place-items: center;
    border-radius: 0.5625rem;
    font-size: 1.05rem;
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
    color: #ead4d1;
    font-size: 1rem;
    font-weight: 700;
  }

  .log-copy small {
    margin-top: 0.125rem;
    color: #b29ba0;
    font-size: 0.86rem;
  }

  .log-result {
    display: grid;
    justify-items: end;
    gap: 0.18rem;
  }

  .log-result time {
    color: #ead5d3;
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }

  .log-result small {
    padding: 0.16rem 0.38rem;
    border-radius: 999px;
    background: rgba(185, 76, 91, 0.1);
    color: #a77a82;
    font-size: 0.82rem;
    font-weight: 720;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .log-result small.completed {
    background: rgba(91, 145, 111, 0.12);
    color: #82b897;
  }

  @media (max-width: 720px) {
    .activity-summary {
      gap: 0.45rem;
    }

    .stat-card {
      grid-template-columns: 1fr;
      gap: 0.45rem;
    }

    .stat-icon {
      width: 2.15rem;
      height: 2.15rem;
      font-size: 1rem;
    }

    .stat-copy strong {
      font-size: 1.25rem;
    }

    .stat-copy > span {
      display: none;
    }
  }
</style>
