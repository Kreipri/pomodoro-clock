<script lang="ts">
  import type { Phase } from "$lib/features/timer/types";
  import Icon from "$lib/components/ui/Icon.svelte";

  type Props = {
    phase: Phase;
    displayTime: string;
    indicatorLabel: string;
    running: boolean;
    pausedByDistraction: boolean;
    overtime: boolean;
    onToggle: () => void;
    onStop: () => void;
  };

  let {
    phase,
    displayTime,
    indicatorLabel,
    running,
    pausedByDistraction,
    overtime,
    onToggle,
    onStop,
  }: Props = $props();
</script>

<div class="timer-controls">
  <div
    class="time-indicator"
    class:paused={pausedByDistraction}
    class:overtime
  >
    <time aria-label={displayTime}>{displayTime}</time>
    <span>{indicatorLabel}</span>
  </div>

    <div class="timer-actions" role="group" aria-label="Timer controls">
    <button
      class="icon-button"
      onclick={onToggle}
      aria-label={running ? "Pause timer" : "Start timer"}
      title={running ? "Pause" : "Start"}
    >
      {#if running}
        <span class="pause-icon" aria-hidden="true"></span>
      {:else}
        <Icon name="play" filled />
      {/if}
    </button>

    <button
      class="icon-button"
      onclick={onStop}
      aria-label={phase === "focus" ? "Skip to break" : "Skip to focus"}
      title={phase === "focus" ? "Skip to break" : "Skip to focus"}
    >
      <Icon name="stop" filled/>
    </button>
  </div>
</div>

<style>
  .timer-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
  }

  .timer-actions {
    display: flex;
    gap: 0.25rem;
    opacity: var(--widget-actions-opacity, 0);
    pointer-events: var(--widget-actions-pointer-events, none);
    transform: var(--widget-actions-transform, translateY(0.3125rem));
    transition:
      opacity 150ms ease,
      transform 150ms ease;
  }

  .icon-button {
    display: grid;
    width: 1.875rem;
    height: 1.875rem;
    padding: 0;
    place-items: center;
    border: 1px solid rgba(255, 235, 231, 0.1);
    border-radius: 50%;
    background: linear-gradient(145deg, rgba(46, 17, 31, 0.8), rgba(16, 7, 16, 0.72));
    color: rgba(247, 224, 220, 0.72);
    font-size: 1rem;
    box-shadow: 0 0.3rem 0.875rem rgba(0, 0, 0, 0.23);
    backdrop-filter: blur(8px);
    transition: var(--transition-fast);
  }

  .icon-button:hover,
  .icon-button:focus-visible {
    border-color: rgba(230, 146, 153, 0.34);
    background: linear-gradient(145deg, rgba(111, 30, 50, 0.9), rgba(41, 10, 27, 0.84));
    color: #fff4ef;
    transform: translateY(-1px);
  }

  .pause-icon {
    width: 0.65rem;
    height: 0.75rem;
    border-right: 2px solid currentColor;
    border-left: 2px solid currentColor;
  }

  .time-indicator {
    display: flex;
    flex-flow: column;
    min-width: 9rem;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.2rem 0.8rem 0.5rem;
    border: 1px solid rgba(255, 232, 226, 0.09);
    border-radius: 15px;
    background: linear-gradient(110deg, rgba(19, 7, 17, 0.82), rgba(88, 22, 42, 0.48));
    box-shadow: 0 0.45rem 1.25rem rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(8px);
  }

  time {
    color: #fff0e9;
    font-family: var(--font-display);
    font-size: 2.5rem; /*TODO: Make variable*/
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .time-indicator > span {
    color: #b29495;
    font-size: 0.47rem;
    font-weight: 850;
    letter-spacing: 0.14em;
  }

  .time-indicator.paused > span {
    color: #efa1aa;
  }

  .time-indicator.overtime {
    background: linear-gradient(110deg, rgba(19, 7, 17, 0.84), rgba(85, 55, 24, 0.54));
  }

</style>
