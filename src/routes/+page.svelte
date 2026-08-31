<script lang="ts">
  import { onMount } from "svelte";
  import { NibblesApp } from "$lib/app/nibbles.svelte";
  import { formatDuration, formatLogTime, formatTrendMinutes, sessionDurationSeconds } from "$lib/features/activity/statistics";
  import CreatureCompanion from "$lib/components/widget/CreatureCompanion.svelte";
  import DistractionBanner from "$lib/components/widget/DistractionBanner.svelte";
  import TimerControls from "$lib/components/widget/TimerControls.svelte";
  import WindowHeader from "$lib/components/widget/WindowHeader.svelte";
  import MenuPanel from "$lib/components/menu/MenuPanel.svelte";
  import RitualSettingsTab from "$lib/components/menu/tabs/RitualSettingsTab.svelte";
  import SoundSettingsTab from "$lib/components/menu/tabs/SoundSettingsTab.svelte";
  import ActivityTab from "$lib/components/menu/tabs/ActivityTab.svelte";

  // The route only composes UI; NibblesApp coordinates stores and platform services.
  const app = new NibblesApp();

  onMount(() => {
    void app.initialize();
    return () => app.dispose();
  });
</script>

<svelte:head>
  <title>Nibbles · Productivity Familiar</title>
  <meta name="description" content="A summoned eldritch Pomodoro familiar that feasts on productivity." />
</svelte:head>

<main class:warning={app.distraction.stage > 0} class:final-form={app.distraction.stage === 3}>
  <section class="familiar" aria-label="Nibbles focus timer">
    <div class="ambient" aria-hidden="true"></div>

    <WindowHeader
      pinned={app.pinned}
      menuOpen={app.settingsOpen}
      onStartDragging={app.startDragging}
      onToggleMenu={app.toggleSettings}
      onTogglePinned={app.togglePinned}
      onMinimize={app.minimize}
      onClose={app.close}
    />

    {#if app.settingsOpen}
      <MenuPanel view={app.menuView} onViewChange={app.setMenuView} onClose={app.toggleSettings}>
        {#if app.menuView === "settings"}
          <RitualSettingsTab
            watchMode={app.settings.watchMode}
            rules={app.settings.rules}
            lastExternalTitle={app.distraction.lastExternalTitle}
            detectionSupported={app.distraction.detectionSupported}
            focusMinutes={app.settings.focusMinutes}
            breakMinutes={app.settings.breakMinutes}
            overtimeEnabled={app.settings.overtimeEnabled}
            growthEvery={app.settings.growthEvery}
            minimizeAfter={app.settings.minimizeAfter}
            finalPopEvery={app.settings.finalPopEvery}
            onSetWatchMode={app.setWatchMode}
            onAddRule={app.addRule}
            onRemoveRule={app.removeRule}
            onUseObservedWindow={app.useObservedWindow}
            onUpdateDuration={app.updateDuration}
            onSettingsChange={app.updateRitualSettings}
            onPreviewForm={app.previewForm}
          />
        {:else if app.menuView === "sound"}
          <SoundSettingsTab
            tickEnabled={app.settings.tickEnabled}
            breakMusicEnabled={app.settings.breakMusicEnabled}
            soundVolume={app.settings.soundVolume}
            tickStyle={app.settings.tickStyle}
            ambientStyle={app.settings.ambientStyle}
            ambientPreviewing={app.ambientPreviewing}
            onSettingsChange={app.updateSoundSettings}
            onPreviewTick={app.previewTick}
            onToggleAmbientPreview={app.toggleAmbientPreview}
          />
        {:else}
          <ActivityTab
            trendChange={app.activity.trendChange}
            trendDays={app.activity.trendDays}
            trendMaximum={app.activity.trendMaximum}
            weekFocusMinutes={app.activity.weekFocusMinutes}
            weekBreakMinutes={app.activity.weekBreakMinutes}
            weekCompletedFocuses={app.activity.weekCompletedFocuses}
            weekSessionCount={app.activity.weekLogs.length}
            averageFocusMinutes={app.activity.averageFocusMinutes}
            weekCompletionRate={app.activity.weekCompletionRate}
            logFilter={app.activity.logFilter}
            filteredLogs={app.activity.filteredLogs}
            totalLogCount={app.activity.sessionLogs.length}
            onFilterChange={app.setLogFilter}
            {formatTrendMinutes}
            {formatLogTime}
            {formatDuration}
            {sessionDurationSeconds}
          />
        {/if}
      </MenuPanel>
    {:else}
      <CreatureCompanion stage={app.distraction.effectiveStage} source={app.distraction.creatureSource} showBook={app.showBook} />
      <TimerControls
        phase={app.timer.phase}
        displayTime={app.timer.displayTime}
        indicatorLabel={app.indicatorLabel}
        progress={app.timerProgress}
        running={app.timer.running}
        pausedByDistraction={app.monitorActive && !app.distraction.isAllowed}
        overtime={app.timer.isOvertime && app.distraction.isAllowed}
        onToggle={app.toggleTimer}
        onStop={app.stopTimer}
        onSkip={app.skipPhase}
      />
      {#if app.monitorActive && !app.distraction.isAllowed}
        <DistractionBanner label={app.distraction.warningLabel} seconds={app.distraction.seconds} activeTitle={app.distraction.activeTitle} />
      {/if}
    {/if}
  </section>
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html), :global(body) { width: 100%; min-width: 100%; min-height: 100%; margin: 0; overflow: hidden; background: transparent !important; color: #f7e8e3; font-family: "Trebuchet MS", "Segoe UI", sans-serif; font-size: 14px; }
  :global(button), :global(input), :global(select) { font: inherit; }
  main { width: 100vw; height: 100vh; background: transparent; }
  .familiar { position: relative; width: 100%; height: 100%; overflow: hidden; isolation: isolate; }
  .ambient { position: absolute; z-index: -1; inset: 8%; pointer-events: none; background: radial-gradient(ellipse at 50% 56%, rgba(54,7,20,.58), rgba(44,8,24,.32) 31%, rgba(22,6,18,.12) 49%, transparent 65%); filter: blur(4px); transition: 400ms ease; }
  .warning .ambient { inset: 3%; background: radial-gradient(ellipse at 50% 54%, rgba(176,22,48,.68), rgba(83,8,28,.28) 43%, transparent 65%); }
  .final-form .ambient { background: radial-gradient(ellipse at 50% 50%, rgba(206,25,52,.76), rgba(91,7,29,.32) 50%, transparent 68%); }
</style>
