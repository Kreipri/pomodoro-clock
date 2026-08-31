<script lang="ts">
  import type { Phase } from "$lib/features/timer/types";

  type Props = {
    phase: Phase;
    displayTime: string;
    indicatorLabel: string;
    progress: number;
    running: boolean;
    pausedByDistraction: boolean;
    overtime: boolean;
    onToggle: () => void;
    onStop: () => void;
    onSkip: () => void;
  };

  let { phase, displayTime, indicatorLabel, progress, running, pausedByDistraction, overtime, onToggle, onStop, onSkip }: Props = $props();
</script>

<div class:paused={pausedByDistraction} class:overtime class="time-indicator">
  <svg class="progress-ring" viewBox="0 0 24 24" aria-hidden="true">
    <circle class="progress-track" cx="12" cy="12" r="9" pathLength="100" />
    <!-- pathLength=100 lets progress map directly to a percentage dash offset. -->
    <circle class="progress-value" cx="12" cy="12" r="9" pathLength="100" style:stroke-dashoffset={100 - progress * 100} />
  </svg>
  <time aria-label={displayTime}>{displayTime}</time><span>{indicatorLabel}</span>
</div>

<div class="timer-actions" role="group" aria-label="Timer controls">
  <button class="icon-button" onclick={onToggle} aria-label={running ? "Pause timer" : "Start timer"} title={running ? "Pause" : "Start"}>
    {#if running}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10M15 7v10" /></svg>{:else}<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z" /></svg>{/if}
  </button>
  <button class="icon-button" onclick={onStop} aria-label="Stop and reset timer" title="Stop"><svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="8" height="8" rx="1.5" /></svg></button>
  <button class="icon-button" onclick={onSkip} aria-label={phase === "focus" ? "Skip to break" : "Skip to focus"} title={phase === "focus" ? "Skip to break" : "Skip to focus"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 6 6-6 6M13 6l6 6-6 6" /></svg></button>
</div>

<style>
  .time-indicator { position: absolute; z-index: 12; left: 50%; bottom: 13px; display: flex; align-items: baseline; gap: 6px; min-width: 112px; padding: 6px 10px; border: 1px solid rgba(255,232,226,.09); border-radius: 999px; background: linear-gradient(110deg, rgba(19,7,17,.82), rgba(88,22,42,.48)); box-shadow: 0 7px 20px rgba(0,0,0,.28); backdrop-filter: blur(8px); transform: translateX(-50%); }
  .progress-ring { width: 18px; height: 18px; overflow: visible; rotate: -90deg; }
  .progress-ring circle { fill: none; stroke-width: 2.5; }
  .progress-track { stroke: rgba(255,235,229,.14); }
  .progress-value { stroke: #86b58f; stroke-dasharray: 100; stroke-dashoffset: 100; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(114,185,133,.65)); transition: stroke-dashoffset .45s linear, stroke .2s ease; }
  .time-indicator time { color: #fff0e9; font-family: Georgia, "Times New Roman", serif; font-size: 1.05rem; font-variant-numeric: tabular-nums; line-height: 1; }
  .time-indicator span { color: #b29495; font-size: .47rem; font-weight: 850; letter-spacing: .14em; }
  .time-indicator.paused .progress-value { stroke: #e24c62; filter: drop-shadow(0 0 3px #d73754); animation: blink .7s steps(2) infinite; }
  .time-indicator.paused span { color: #efa1aa; }
  .time-indicator.overtime { background: linear-gradient(110deg, rgba(19,7,17,.84), rgba(85,55,24,.54)); }
  .timer-actions { position: absolute; z-index: 16; left: 50%; bottom: 51px; display: flex; gap: 4px; opacity: 0; pointer-events: none; transform: translate(-50%,5px); transition: opacity 150ms ease, transform 150ms ease; }
  :global(.familiar:hover) .timer-actions, :global(.familiar:focus-within) .timer-actions { opacity: 1; pointer-events: auto; transform: translateX(-50%); }
  button { border: 0; cursor: pointer; }
  .icon-button { display: grid; width: 30px; height: 30px; padding: 0; place-items: center; border: 1px solid rgba(255,235,231,.1); border-radius: 50%; background: linear-gradient(145deg, rgba(46,17,31,.8), rgba(16,7,16,.72)); color: rgba(247,224,220,.72); box-shadow: 0 5px 14px rgba(0,0,0,.23); backdrop-filter: blur(8px); transition: 130ms ease; }
  .icon-button svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .icon-button svg.filled-icon { fill: currentColor; stroke: none; }
  .icon-button:hover, .icon-button:focus-visible { border-color: rgba(230,146,153,.34); color: #fff4ef; background: linear-gradient(145deg, rgba(111,30,50,.9), rgba(41,10,27,.84)); transform: translateY(-1px); }
  @keyframes blink { 50% { opacity: .25; } }
  @media (max-width: 430px), (max-height: 390px) { .time-indicator { bottom: 10px; } .timer-actions { bottom: 47px; } }
</style>
