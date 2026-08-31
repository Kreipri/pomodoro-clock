<script lang="ts">
  import type { NibblesApp } from "$lib/app/nibbles.svelte";
  import ActivityTab from "$lib/components/menu/tabs/ActivityTab.svelte";
  import RitualSettingsTab from "$lib/components/menu/tabs/RitualSettingsTab.svelte";
  import SoundSettingsTab from "$lib/components/menu/tabs/SoundSettingsTab.svelte";
  import Icon from "./Icon.svelte";

  let { app }: { app: NibblesApp } = $props();

  const titles = {
    settings: "Ritual settings",
    sound: "Sound settings",
    activity: "Focus activity"
  } as const;
</script>

<!-- MenuUI owns the complete menu shell, navigation, and active-tab placement. -->
<section class="menu-ui" aria-label="Nibbles menu">
  <button class="menu-backdrop" onclick={app.toggleSettings} aria-label="Close menu"></button>

  <div class="menu-panel">
    <header class="menu-header">
      <div class="menu-title">
        <p>NIBBLES</p>
        <h1>{titles[app.menuView]}</h1>
      </div>

      <div class="menu-tools">
        <nav class="menu-tabs" aria-label="Menu sections">
          <button
            class:active={app.menuView === "settings"}
            onclick={() => app.setMenuView("settings")}
            aria-label="Settings"
            aria-pressed={app.menuView === "settings"}
            title="Settings"
          >
            <Icon name="settings" />
          </button>

          <button
            class:active={app.menuView === "sound"}
            onclick={() => app.setMenuView("sound")}
            aria-label="Sound settings"
            aria-pressed={app.menuView === "sound"}
            title="Sound settings"
          >
            <Icon name="sound" />
          </button>

          <button
            class:active={app.menuView === "activity"}
            onclick={() => app.setMenuView("activity")}
            aria-label="Focus activity"
            aria-pressed={app.menuView === "activity"}
            title="Focus activity"
          >
            <Icon name="activity" />
          </button>
        </nav>

        <button class="close-button" onclick={app.toggleSettings} aria-label="Close menu" title="Close">
          <Icon name="close" />
        </button>
      </div>
    </header>

    <div class="menu-content">
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
        />
      {/if}
    </div>
  </div>
</section>

<style>
  .menu-ui {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .menu-backdrop {
    position: absolute;
    z-index: 9;
    inset: 0;
    border: 0;
    background: rgba(6, 2, 7, 0.22);
    backdrop-filter: blur(3px);
    cursor: default;
  }

  .menu-panel {
    position: absolute;
    z-index: 10;
    inset: 0.75rem;
    display: flex;
    overflow: hidden;
    padding: 1.5rem;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: 2.375rem 1.5625rem 2.5rem 1.6875rem / 1.875rem 2.5625rem 1.6875rem 2.4375rem;
    background:
      radial-gradient(circle at 18% 3%, rgba(103, 31, 50, 0.34), transparent 31%),
      linear-gradient(150deg, var(--color-surface), rgba(9, 5, 12, 0.95));
    box-shadow:
      0 1.375rem 3.4375rem rgba(0, 0, 0, 0.52),
      inset 0 1px rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(14px);
  }

  .menu-header {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.625rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.055);
  }

  .menu-title {
    min-width: 0;
  }

  .menu-title p {
    margin: 0 0 0.125rem;
    color: #b58b94;
    font-size: 0.62rem;
    font-weight: 850;
    letter-spacing: 0.16em;
  }

  .menu-title h1 {
    overflow: hidden;
    margin: 0;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 1.65rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-tools,
  .menu-tabs {
    display: flex;
    align-items: center;
  }

  .menu-tools {
    flex: 0 0 auto;
    gap: 0.5rem;
  }

  .menu-tabs {
    gap: 0.2rem;
    padding: 0.2rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.22);
  }

  .menu-tabs button,
  .close-button {
    display: grid;
    width: 1.9rem;
    height: 1.9rem;
    padding: 0;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 50%;
    font-size: 0.95rem;
    transition: var(--transition-fast);
  }

  .menu-tabs button {
    background: transparent;
    color: #765f68;
  }

  .menu-tabs button:hover,
  .menu-tabs button:focus-visible {
    color: #e8ced0;
  }

  .menu-tabs button.active {
    border-color: rgba(244, 111, 130, 0.2);
    background: linear-gradient(145deg, rgba(130, 34, 58, 0.8), rgba(55, 13, 34, 0.83));
    color: #fff0ec;
    box-shadow: 0 0.2rem 0.625rem rgba(38, 4, 20, 0.3);
  }

  .close-button {
    border-color: var(--color-border);
    background: linear-gradient(145deg, rgba(46, 17, 31, 0.8), rgba(16, 7, 16, 0.72));
    color: rgba(247, 224, 220, 0.72);
    box-shadow: 0 0.3rem 0.875rem rgba(0, 0, 0, 0.23);
  }

  .close-button:hover,
  .close-button:focus-visible {
    border-color: rgba(230, 146, 153, 0.34);
    background: linear-gradient(145deg, rgba(111, 30, 50, 0.9), rgba(41, 10, 27, 0.84));
    color: #fff4ef;
    transform: translateY(-1px);
  }

  .menu-content {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    padding-right: 0.1875rem;
    overflow: auto;
    scrollbar-color: #633048 transparent;
    scrollbar-width: thin;
  }

  .menu-content > :global(*) {
    width: 100%;
  }
</style>
