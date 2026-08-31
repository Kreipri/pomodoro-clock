<script lang="ts">
  type Props = {
    progress: number;
    paused: boolean;
    overtime: boolean;
  };

  let { progress, paused, overtime }: Props = $props();
</script>

<!--
  This is a visual backdrop. WidgetUI sets --timer-progress-size so the ring
  can grow with the creature without owning any window-level positioning.
-->
<svg
  class="timer-progress"
  class:paused
  class:overtime
  viewBox="0 0 100 100"
  aria-hidden="true"
>
  <circle class="progress-track" cx="50" cy="50" r="35" pathLength="100" />
  <circle
    class="progress-value"
    cx="50"
    cy="50"
    r="35"
    pathLength="100"
    style:stroke-dashoffset={100 - progress * 100}
  />
</svg>

<style>
  .timer-progress {
    width: var(--timer-progress-size);
    height: var(--timer-progress-size);
    overflow: visible;
    rotate: -90deg;
    filter: drop-shadow(0 0 0.5rem rgba(114, 185, 133, 0.2));
  }

  circle {
    fill: none;
    stroke-width: 10;
  }

  .progress-track {
    stroke: rgba(255, 235, 229, 0.1);
  }

  .progress-value {
    stroke: #6dbf7c;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    stroke-linecap: round;
    filter: drop-shadow(0 0 0.12rem rgba(114, 185, 133, 0.8));
    transition:
      stroke-dashoffset 450ms linear,
      stroke 200ms ease;
  }

  .timer-progress.paused .progress-value {
    stroke: #e24c62;
    filter: drop-shadow(0 0 0.18rem #d73754);
    animation: blink 700ms steps(2) infinite;
  }

  .timer-progress.overtime .progress-value {
    stroke: #d6aa68;
    filter: drop-shadow(0 0 0.18rem rgba(214, 170, 104, 0.75));
  }

  @keyframes blink {
    50% {
      opacity: 0.25;
    }
  }
</style>
