<script lang="ts">
  import type { NibblesApp } from "$lib/app/nibbles.svelte";
  import CreatureCompanion from "$lib/components/widget/CreatureCompanion.svelte";
  import DistractionBanner from "$lib/components/widget/DistractionBanner.svelte";
  import TimerControls from "$lib/components/widget/TimerControls.svelte";
  import TimerProgress from "$lib/components/widget/TimerProgress.svelte";
  import WindowHeader from "$lib/components/widget/WindowHeader.svelte";

  let { app }: { app: NibblesApp } = $props();
</script>

<!--
  WidgetUI owns every component's position inside the companion window.
  Leaf components should not use window-relative absolute positioning.
-->
<section
  class="widget-ui"
  class:warning={app.distraction.stage > 0}
  class:final-form={app.distraction.stage === 3}
  aria-label="Nibbles focus timer"
>
  <div class="ambient" aria-hidden="true"></div>

  <div class="header-layer">
    <WindowHeader
      pinned={app.pinned}
      onStartDragging={app.startDragging}
      onToggleMenu={app.toggleSettings}
      onTogglePinned={app.togglePinned}
      onMinimize={app.minimize}
      onClose={app.close}
    />
  </div>

  <!-- WidgetUI owns the stacking order: progress first, creature above it. -->
  <div class="progress-layer stage-{app.distraction.effectiveStage}">
    <TimerProgress
      progress={app.timerProgress}
      paused={app.monitorActive && !app.distraction.isAllowed}
      overtime={app.timer.isOvertime && app.distraction.isAllowed}
    />
  </div>

  <div class="creature-layer" class:expanded={app.distraction.effectiveStage === 3}>
    <CreatureCompanion
      stage={app.distraction.effectiveStage}
      source={app.distraction.creatureSource}
      showBook={app.showBook}
    />
  </div>

  <div class="timer-layer">
    <TimerControls
      phase={app.timer.phase}
      displayTime={app.timer.displayTime}
      indicatorLabel={app.indicatorLabel}
      running={app.timer.running}
      pausedByDistraction={app.monitorActive && !app.distraction.isAllowed}
      overtime={app.timer.isOvertime && app.distraction.isAllowed}
      onToggle={app.toggleTimer}
      onStop={app.stopTimer}
    />
  </div>

  {#if app.monitorActive && !app.distraction.isAllowed}
    <div class="warning-layer">
      <DistractionBanner
        label={app.distraction.warningLabel}
        seconds={app.distraction.seconds}
        activeTitle={app.distraction.activeTitle}
      />
    </div>
  {/if}
</section>

<style>
  .widget-ui {
    --widget-actions-opacity: 0;
    --widget-actions-pointer-events: none;
    --widget-actions-transform: translateY(0.3125rem);
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
  }

  .widget-ui:hover,
  .widget-ui:focus-within {
    --widget-actions-opacity: 1;
    --widget-actions-pointer-events: auto;
    --widget-actions-transform: none;
  }

  .ambient {
    position: absolute;
    z-index: -1;
    inset: 8%;
    pointer-events: none;
    background: radial-gradient(
      ellipse at 50% 56%,
      rgba(54, 7, 20, 0.58),
      rgba(44, 8, 24, 0.32) 31%,
      rgba(22, 6, 18, 0.12) 49%,
      transparent 65%
    );
    filter: blur(4px);
    transition: 400ms ease;
  }

  .warning .ambient {
    inset: 3%;
    background: radial-gradient(
      ellipse at 50% 54%,
      rgba(176, 22, 48, 0.68),
      rgba(83, 8, 28, 0.28) 43%,
      transparent 65%
    );
  }

  .final-form .ambient {
    background: radial-gradient(
      ellipse at 50% 50%,
      rgba(206, 25, 52, 0.76),
      rgba(91, 7, 29, 0.32) 50%,
      transparent 68%
    );
  }

  .header-layer {
    position: absolute;
    z-index: 20;
    inset: 0 0 0 0;
    height: 3rem;
    opacity: var(--widget-actions-opacity);
    transition: opacity 150ms ease;
  }

  .creature-layer {
    position: absolute;
    z-index: 5;
    inset: 1rem 0 3rem 0.7rem;
    pointer-events: none;
  }

  .creature-layer.expanded {
    inset: 1.75rem 2.125rem 3.875rem;
  }

  .progress-layer {
    --timer-progress-size: min(72vw, 15.5rem);
    position: absolute;
    z-index: 4;
    inset: 0 0 3rem;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .progress-layer.stage-1 {
    --timer-progress-size: min(92vw, 26rem);
  }

  .progress-layer.stage-2 {
    --timer-progress-size: min(94vw, 43rem);
  }

  .progress-layer.stage-3 {
    --timer-progress-size: min(88vw, 68rem);
    inset: 1.75rem 2.125rem 3.875rem;
  }

  .timer-layer {
    position: absolute;
    z-index: 16;
    left: 50%;
    bottom: 0.8rem;
    top: 13rem;
    transform: translateX(-50%);
  }

  .warning-layer {
    position: absolute;
    z-index: 13;
    top: 9%;
    left: 50%;
    width: min(82vw, 32.5rem);
    transform: translateX(-50%);
  }

  @media (max-width: 430px), (max-height: 390px) {
    .header-layer {
      height: 2.75rem;
    }

    .timer-layer {
      bottom: 0.625rem;
    }
  }
</style>
