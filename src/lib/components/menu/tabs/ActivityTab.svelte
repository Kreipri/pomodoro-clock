<script lang="ts">
  import type { LogFilter, SessionLog, TrendDay } from "$lib/features/activity/types";

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
    formatTrendMinutes: (minutes: number) => string;
    formatLogTime: (timestamp: number) => string;
    formatDuration: (seconds: number) => string;
    sessionDurationSeconds: (log: SessionLog) => number;
  };

  let {
    trendChange, trendDays, trendMaximum, weekFocusMinutes, weekBreakMinutes,
    weekCompletedFocuses, weekSessionCount, averageFocusMinutes, weekCompletionRate,
    logFilter, filteredLogs, totalLogCount, onFilterChange, formatTrendMinutes,
    formatLogTime, formatDuration, sessionDurationSeconds
  }: Props = $props();
</script>

<div class="menu-view stats-section activity-view" id="activity-view" role="tabpanel" aria-label="Focus activity">
  <div class="section-heading activity-heading">
    <div><p class="section-kicker">LAST 7 DAYS</p><h2>Your week</h2></div>
    <span class:trend-up={trendChange > 0} class:trend-down={trendChange < 0} class="trend-change" title="Recent three days compared with the prior three days">
      {#if trendChange > 0}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 11 4-4 2.5 2.5L13 6"/><path d="M9.5 6H13v3.5"/></svg>{:else if trendChange < 0}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 5 4 4 2.5-2.5L13 10"/><path d="M9.5 10H13V6.5"/></svg>{:else}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>{/if}
      {Math.abs(trendChange)}%
    </span>
  </div>

  <div class="activity-summary" aria-label="Seven-day totals and averages">
    <div><span>Focus</span><strong>{formatTrendMinutes(weekFocusMinutes)}</strong></div>
    <div><span>Break</span><strong>{formatTrendMinutes(weekBreakMinutes)}</strong></div>
    <div><span>Fed</span><strong>{weekCompletedFocuses}</strong></div>
    <div><span>Sessions</span><strong>{weekSessionCount}</strong></div>
    <div><span>Avg focus</span><strong>{averageFocusMinutes}m</strong></div>
    <div><span>Completion</span><strong>{weekCompletionRate}%</strong></div>
  </div>

  <div class="trend-chart" role="img" aria-label={`Seven-day chart: ${formatTrendMinutes(weekFocusMinutes)} focused and ${formatTrendMinutes(weekBreakMinutes)} on breaks`}>
    {#each trendDays as day}
      <div class="trend-day">
        <div class="bar-pair">
          <!-- A small non-zero floor keeps short completed sessions visible. -->
          <span class="focus-bar" title={`${formatTrendMinutes(day.focusMinutes)} focus`} style:height={`${day.focusMinutes > 0 ? Math.max(4, day.focusMinutes / trendMaximum * 100) : 0}%`}></span>
          <span class="break-bar" title={`${formatTrendMinutes(day.breakMinutes)} break`} style:height={`${day.breakMinutes > 0 ? Math.max(4, day.breakMinutes / trendMaximum * 100) : 0}%`}></span>
        </div>
        <small>{day.label}</small>
      </div>
    {/each}
  </div>
  <div class="trend-legend" aria-hidden="true"><span><i class="focus-key"></i>Focus</span><span><i class="break-key"></i>Break</span></div>

  <div class="session-heading">
    <h3>Sessions</h3>
    <div class="log-filters" role="group" aria-label="Filter sessions">
      <button class:active={logFilter === "all"} onclick={() => onFilterChange("all")} aria-label="Show all sessions" aria-pressed={logFilter === "all"} title="All sessions"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 5h9M6.5 10h9M6.5 15h9"/><circle cx="3.5" cy="5" r=".8"/><circle cx="3.5" cy="10" r=".8"/><circle cx="3.5" cy="15" r=".8"/></svg></button>
      <button class:active={logFilter === "focus"} onclick={() => onFilterChange("focus")} aria-label="Show focus sessions" aria-pressed={logFilter === "focus"} title="Focus sessions"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="2.5"/><path d="M10 1.5V4M18.5 10H16"/></svg></button>
      <button class:active={logFilter === "break"} onclick={() => onFilterChange("break")} aria-label="Show break sessions" aria-pressed={logFilter === "break"} title="Break sessions"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14.8 13.6A6.7 6.7 0 0 1 6.4 5.2 6.7 6.7 0 1 0 14.8 13.6Z"/></svg></button>
    </div>
  </div>

  {#if filteredLogs.length === 0}
    <div class="empty-log"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v7l4 2M21 12a9 9 0 1 1-3-6.7"/></svg><p>{totalLogCount === 0 ? "Complete or skip a ritual and it will appear here." : "No sessions match this filter yet."}</p></div>
  {:else}
    <ol class="log-list">
      {#each filteredLogs as log}
        <li>
          <span class:focus={log.phase === "focus"} class:break={log.phase === "break"} class="log-icon" aria-hidden="true">
            {#if log.phase === "focus"}<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5.5"/><circle cx="10" cy="10" r="2"/></svg>{:else}<svg viewBox="0 0 20 20"><path d="M14.8 13.6A6.7 6.7 0 0 1 6.4 5.2 6.7 6.7 0 1 0 14.8 13.6Z"/></svg>{/if}
          </span>
          <span class="log-copy"><strong>{log.phase === "focus" ? "Focus" : "Break"}</strong><small>{log.completed ? "Completed" : "Skipped"}{log.overtimeSeconds > 0 ? ` · +${Math.ceil(log.overtimeSeconds / 60)}m flow` : ""} · {formatLogTime(log.endedAt)}</small></span>
          <time datetime={new Date(log.endedAt).toISOString()}>{formatDuration(sessionDurationSeconds(log))}</time>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .menu-view { min-height: 0; flex: 1 1 auto; padding-right: 3px; overflow: auto; scrollbar-width: thin; scrollbar-color: #633048 transparent; }
  .stats-section { padding: 10px 3px 6px 0; }
  .activity-view .trend-chart { height: 124px; }
  .activity-view .log-list { max-height: 300px; }
  .section-heading { display: flex; align-items: center; justify-content: space-between; }
  .activity-heading { align-items: flex-end; margin-bottom: 11px; }
  h2 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 1.15rem; font-weight: 600; }
  .section-kicker { margin: 0 0 2px; color: #9a7b82; font-size: .55rem; font-weight: 850; letter-spacing: .13em; }
  .trend-change { display: inline-flex; align-items: center; gap: 3px; padding: 4px 7px; border: 1px solid rgba(255,255,255,.06); border-radius: 999px; background: rgba(255,255,255,.035); color: #a99497; font-size: .62rem; font-weight: 800; }
  .trend-change svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
  .trend-change.trend-up { border-color: rgba(127,178,139,.14); background: rgba(81,135,96,.1); color: #8dc39a; }
  .trend-change.trend-down { border-color: rgba(229,87,111,.15); background: rgba(155,38,61,.11); color: #f06a7e; }
  .activity-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 9px; }
  .activity-summary div { padding: 7px 8px 6px; border: 1px solid rgba(255,255,255,.055); border-radius: 11px; background: linear-gradient(145deg, rgba(255,255,255,.035), rgba(0,0,0,.07)); }
  .activity-summary span, .activity-summary strong { display: block; }
  .activity-summary span { margin-bottom: 2px; color: #a28c90; font-size: .64rem; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; }
  .activity-summary strong { overflow: hidden; color: #f0ddda; font-family: Georgia, "Times New Roman", serif; font-size: 1.02rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .trend-chart { display: grid; grid-template-columns: repeat(7, 1fr); height: 100px; padding: 9px 8px 3px; border: 1px solid rgba(255,255,255,.05); border-radius: 13px; background: repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(255,255,255,.035) 28px), rgba(0,0,0,.13); }
  .trend-day { display: grid; grid-template-rows: 1fr 13px; min-width: 0; text-align: center; }
  .bar-pair { display: flex; align-items: flex-end; justify-content: center; gap: 3px; min-height: 0; }
  .bar-pair > span { display: block; width: 7px; min-height: 0; border-radius: 5px 5px 2px 2px; transition: height 240ms ease; }
  .focus-bar { background: linear-gradient(to top, #8e2444, #ff6077); box-shadow: 0 0 9px rgba(240,66,94,.2); }
  .break-bar { background: linear-gradient(to top, #526d65, #91b8a7); opacity: .8; }
  .trend-day small { align-self: end; color: #927d82; font-size: .56rem; font-weight: 700; }
  .trend-legend { display: flex; justify-content: flex-end; gap: 10px; margin: 5px 2px 12px; color: #958084; font-size: .56rem; }
  .trend-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .trend-legend i { width: 5px; height: 5px; border-radius: 50%; }
  .trend-legend .focus-key { background: #ed4e68; box-shadow: 0 0 5px rgba(237,78,104,.35); }
  .trend-legend .break-key { background: #87ad9e; }
  .session-heading { display: flex; align-items: center; justify-content: space-between; margin: 0 0 7px; }
  .session-heading h3 { margin: 0; color: #d9c1bf; font-family: Georgia, "Times New Roman", serif; font-size: 1rem; font-weight: 600; }
  .log-filters { display: flex; gap: 4px; padding: 3px; border-radius: 999px; background: rgba(0,0,0,.2); }
  button { border: 0; color: inherit; cursor: pointer; }
  .log-filters button { display: grid; width: 25px; height: 25px; padding: 0; place-items: center; border: 1px solid transparent; border-radius: 50%; background: transparent; color: #77636a; transition: 130ms ease; }
  .log-filters button:hover, .log-filters button:focus-visible { color: #e4c9c8; }
  .log-filters button.active { border-color: rgba(245,111,129,.22); background: linear-gradient(145deg, rgba(137,37,61,.75), rgba(61,15,38,.78)); color: #fff0eb; box-shadow: 0 3px 10px rgba(42,6,22,.28); }
  .log-filters svg, .empty-log svg, .log-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; }
  .empty-log { display: flex; min-height: 58px; align-items: center; justify-content: center; gap: 9px; padding: 9px 12px; border: 1px dashed rgba(255,255,255,.065); border-radius: 11px; color: #705e64; }
  .empty-log svg { flex: 0 0 auto; width: 19px; height: 19px; }
  .empty-log p { max-width: 260px; margin: 0; font-size: .76rem; line-height: 1.35; }
  .log-list { display: grid; max-height: 252px; gap: 5px; margin: 0; padding: 0 3px 0 0; overflow: auto; list-style: none; scrollbar-width: thin; scrollbar-color: #5f2940 transparent; }
  .log-list li { display: grid; grid-template-columns: 31px minmax(0,1fr) auto; align-items: center; gap: 8px; min-height: 43px; padding: 5px 8px 5px 5px; border: 1px solid rgba(255,255,255,.045); border-radius: 11px; background: rgba(255,255,255,.022); }
  .log-icon { display: grid; width: 29px; height: 29px; place-items: center; border-radius: 9px; }
  .log-icon.focus { background: rgba(168,38,65,.15); color: #f45d75; }
  .log-icon.break { background: rgba(95,137,123,.14); color: #91bbaa; }
  .log-copy { min-width: 0; }
  .log-copy strong, .log-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .log-copy strong { color: #d9c0be; font-size: .78rem; font-weight: 700; }
  .log-copy small { margin-top: 2px; color: #927c81; font-size: .66rem; }
  .log-list time { color: #b99da1; font-size: .7rem; font-variant-numeric: tabular-nums; }
</style>
