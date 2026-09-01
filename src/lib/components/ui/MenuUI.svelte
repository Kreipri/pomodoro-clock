<script lang="ts">
  import type { NibblesApp } from "$lib/app/nibbles.svelte";
  import ActivityTab from "$lib/components/menu/tabs/ActivityTab.svelte";
  import RitualSettingsTab from "$lib/components/menu/tabs/RitualSettingsTab.svelte";
  import SoundSettingsTab from "$lib/components/menu/tabs/SoundSettingsTab.svelte";
  import Icon from "./Icon.svelte";

  let { app }: { app: NibblesApp } = $props();

  const viewDetails = {
    settings: {
      eyebrow: "CUSTOMIZE",
      title: "Ritual settings",
      description: "Shape the timer, window rules, and how Nibbles responds."
    },
    sound: {
      eyebrow: "LISTEN",
      title: "Sound settings",
      description: "Choose the sounds that accompany focus and rest."
    },
    activity: {
      eyebrow: "REFLECT",
      title: "Focus activity",
      description: "See where your attention went over the last seven days."
    }
  } as const;

  const resizeHandles = [
    { direction: "North", className: "north", label: "Resize from top" },
    { direction: "South", className: "south", label: "Resize from bottom" },
    { direction: "East", className: "east", label: "Resize from right" },
    { direction: "West", className: "west", label: "Resize from left" },
    { direction: "NorthEast", className: "north-east", label: "Resize from top right" },
    { direction: "NorthWest", className: "north-west", label: "Resize from top left" },
    { direction: "SouthEast", className: "south-east", label: "Resize from bottom right" },
    { direction: "SouthWest", className: "south-west", label: "Resize from bottom left" }
  ] as const;
</script>

<!-- MenuUI owns the whole resizable desktop-menu composition. -->
<section class="menu-ui" aria-label="Nibbles menu">
  <div class="menu-backdrop" aria-hidden="true"></div>

  <div class="menu-panel">
    <!--
      Empty header space starts native window dragging. The desktop service
      ignores buttons so the close control remains independently clickable.
    -->
    <div
      class="title-bar"
      role="toolbar"
      tabindex="-1"
      aria-label="Draggable window title bar"
      data-tauri-drag-region
      onpointerdown={app.startDragging}
    >
      <div class="brand" data-tauri-drag-region>
        <span class="brand-mark" aria-hidden="true"></span>
        <div data-tauri-drag-region>
          <strong data-tauri-drag-region>NIBBLES</strong>
          <small data-tauri-drag-region>FOCUS COMPANION</small>
        </div>
      </div>

      <div class="drag-hint" data-tauri-drag-region aria-hidden="true">
        <i></i><i></i><i></i>
      </div>

      <button
        class="close-button"
        onclick={app.toggleSettings}
        aria-label="Close menu"
        title="Close menu"
      >
        <Icon name="close" />
      </button>
    </div>

    <div class="menu-body">
      <aside class="menu-sidebar">
        <nav class="menu-tabs" aria-label="Menu sections">
          <button
            class:active={app.menuView === "activity"}
            onclick={() => app.setMenuView("activity")}
            aria-pressed={app.menuView === "activity"}
          >
            <span class="tab-icon"><Icon name="activity" /></span>
            <span>
              <strong>Activity</strong>
              <small>Your focus history</small>
            </span>
          </button>

          <button
            class:active={app.menuView === "settings"}
            onclick={() => app.setMenuView("settings")}
            aria-pressed={app.menuView === "settings"}
          >
            <span class="tab-icon"><Icon name="settings" /></span>
            <span>
              <strong>Ritual</strong>
              <small>Timer and window rules</small>
            </span>
          </button>

          <button
            class:active={app.menuView === "sound"}
            onclick={() => app.setMenuView("sound")}
            aria-pressed={app.menuView === "sound"}
          >
            <span class="tab-icon"><Icon name="sound" /></span>
            <span>
              <strong>Sound</strong>
              <small>Ticks and ambience</small>
            </span>
          </button>
        </nav>

        <p class="resize-note">
          Drag the title bar to move this window. Drag any edge to resize it.
        </p>
      </aside>

      <section class="menu-workspace">
        <header class="view-heading">
          <p>{viewDetails[app.menuView].eyebrow}</p>
          <h1>{viewDetails[app.menuView].title}</h1>
          <span>{viewDetails[app.menuView].description}</span>
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
              averageFocusMinutes={app.activity.averageFocusMinutes}
              logFilter={app.activity.logFilter}
              filteredLogs={app.activity.filteredLogs}
              totalLogCount={app.activity.sessionLogs.length}
              onFilterChange={app.setLogFilter}
            />
          {/if}
        </div>
      </section>
    </div>
  </div>

  <!-- Frameless windows need explicit edge hit areas for reliable resizing. -->
  {#each resizeHandles as handle}
    <button
      class="resize-handle {handle.className}"
      tabindex="-1"
      aria-label={handle.label}
      onpointerdown={(event) => app.startResizing(handle.direction, event)}
    ></button>
  {/each}
</section>

<style>
  .menu-ui {
    --font-body: "Segoe UI Variable Text", "Segoe UI", sans-serif;
    --font-display: "Segoe UI Variable Display", "Segoe UI", sans-serif;
    position: relative;
    width: 100%;
    height: 100%;
    color: #f8eeee;
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.5;
  }

  .menu-backdrop {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 12% 10%, rgba(142, 42, 67, 0.2), transparent 32%),
      rgba(4, 2, 6, 0.48);
    backdrop-filter: blur(0.5rem);
  }

  .menu-panel {
    position: absolute;
    inset: 0.5rem;
    display: grid;
    grid-template-rows: 4.25rem minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid rgba(255, 234, 233, 0.1);
    border-radius: 1.5rem;
    background:
      radial-gradient(circle at 5% 3%, rgba(136, 39, 64, 0.22), transparent 30%),
      linear-gradient(145deg, rgba(29, 15, 27, 0.985), rgba(10, 7, 13, 0.99));
    box-shadow:
      0 1.5rem 4rem rgba(0, 0, 0, 0.58),
      inset 0 1px rgba(255, 255, 255, 0.045);
  }

  .title-bar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    padding: 0 1rem 0 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.065);
    cursor: move;
    user-select: none;
  }

  .brand {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-mark {
    width: 0.75rem;
    height: 0.75rem;
    flex: 0 0 auto;
    border: 2px solid #e65370;
    border-radius: 50%;
    box-shadow:
      0 0 0 0.25rem rgba(230, 83, 112, 0.1),
      0 0 1rem rgba(230, 83, 112, 0.38);
  }

  .brand strong,
  .brand small {
    display: block;
  }

  .brand strong {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 720;
    letter-spacing: 0.14em;
  }

  .brand small {
    margin-top: 0.125rem;
    color: #a28d93;
    font-size: 0.8rem;
    font-weight: 650;
    letter-spacing: 0.11em;
  }

  .drag-hint {
    display: flex;
    gap: 0.2rem;
    padding: 0.75rem 2rem;
  }

  .drag-hint i {
    width: 0.2rem;
    height: 0.2rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
  }

  .close-button {
    display: grid;
    width: 2.35rem;
    height: 2.35rem;
    justify-self: end;
    padding: 0;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.035);
    color: #a99096;
    font-size: 1.1rem;
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .close-button:hover,
  .close-button:focus-visible {
    border-color: rgba(239, 99, 124, 0.28);
    background: rgba(149, 41, 64, 0.34);
    color: #fff4f1;
  }

  .menu-body {
    display: grid;
    grid-template-columns: 13.5rem minmax(0, 1fr);
    min-height: 0;
  }

  .menu-sidebar {
    display: flex;
    min-height: 0;
    padding: 1.35rem 1rem 1.1rem;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.055);
    background: rgba(0, 0, 0, 0.13);
  }

  .menu-tabs {
    display: grid;
    gap: 0.45rem;
  }

  .menu-tabs button {
    display: grid;
    grid-template-columns: 2.45rem minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 3.65rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid transparent;
    border-radius: 0.9rem;
    background: transparent;
    color: #8d787f;
    text-align: left;
    transition: var(--transition-fast);
  }

  .tab-icon {
    display: grid;
    width: 2.35rem;
    height: 2.35rem;
    place-items: center;
    border-radius: 0.7rem;
    background: rgba(255, 255, 255, 0.035);
    font-size: 1.15rem;
  }

  .menu-tabs strong,
  .menu-tabs small {
    display: block;
  }

  .menu-tabs strong {
    color: #dac7ca;
    font-size: 1rem;
    font-weight: 650;
  }

  .menu-tabs small {
    overflow: hidden;
    margin-top: 0.12rem;
    color: #a08a90;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-tabs button:hover,
  .menu-tabs button:focus-visible {
    border-color: rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.035);
    color: #dfc9cd;
  }

  .menu-tabs button.active {
    border-color: rgba(239, 99, 124, 0.19);
    background:
      linear-gradient(120deg, rgba(132, 37, 61, 0.38), rgba(74, 24, 45, 0.2));
    color: #ff7088;
    box-shadow: inset 0 1px rgba(255, 255, 255, 0.035);
  }

  .menu-tabs button.active strong {
    color: #fff0ee;
  }

  .menu-tabs button.active small {
    color: #b98e98;
  }

  .menu-tabs button.active .tab-icon {
    background: rgba(184, 52, 78, 0.2);
    box-shadow: 0 0.45rem 1rem rgba(41, 5, 20, 0.2);
  }

  .resize-note {
    margin: auto 0.35rem 0;
    color: #948087;
    font-size: 0.86rem;
    line-height: 1.55;
  }

  .menu-workspace {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
    padding: 1.6rem 1.75rem 1.5rem;
  }

  .view-heading {
    padding-bottom: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .view-heading p {
    margin: 0 0 0.3rem;
    color: #d0546c;
    font-size: 0.82rem;
    font-weight: 750;
    letter-spacing: 0.16em;
  }

  .view-heading h1 {
    margin: 0;
    color: #fff2ef;
    font-family: var(--font-display);
    font-size: clamp(1.7rem, 3.2vw, 2.35rem);
    font-weight: 670;
    letter-spacing: -0.035em;
    line-height: 1.08;
  }

  .view-heading span {
    display: block;
    max-width: 34rem;
    margin-top: 0.45rem;
    color: #b39da2;
    font-size: 0.96rem;
    line-height: 1.55;
  }

  .menu-content {
    min-width: 0;
    min-height: 0;
    padding-right: 0.35rem;
    overflow: auto;
    scrollbar-color: #6f3048 transparent;
    scrollbar-width: thin;
  }

  .menu-content > :global(*) {
    width: 100%;
  }

  .resize-handle {
    position: absolute;
    z-index: 50;
    padding: 0;
    background: transparent;
  }

  .resize-handle.north,
  .resize-handle.south {
    right: 0.75rem;
    left: 0.75rem;
    height: 0.5rem;
  }

  .resize-handle.east,
  .resize-handle.west {
    top: 0.75rem;
    bottom: 0.75rem;
    width: 0.5rem;
  }

  .resize-handle.north {
    top: 0;
    cursor: n-resize;
  }

  .resize-handle.south {
    bottom: 0;
    cursor: s-resize;
  }

  .resize-handle.east {
    right: 0;
    cursor: e-resize;
  }

  .resize-handle.west {
    left: 0;
    cursor: w-resize;
  }

  .resize-handle.north-east,
  .resize-handle.north-west,
  .resize-handle.south-east,
  .resize-handle.south-west {
    width: 0.9rem;
    height: 0.9rem;
  }

  .resize-handle.north-east {
    top: 0;
    right: 0;
    cursor: ne-resize;
  }

  .resize-handle.north-west {
    top: 0;
    left: 0;
    cursor: nw-resize;
  }

  .resize-handle.south-east {
    right: 0;
    bottom: 0;
    cursor: se-resize;
  }

  .resize-handle.south-west {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
  }

  @media (max-width: 640px) {
    .menu-panel {
      inset: 0.35rem;
      grid-template-rows: 3.75rem minmax(0, 1fr);
      border-radius: 1.15rem;
    }

    .title-bar {
      padding-inline: 0.85rem;
    }

    .brand small,
    .drag-hint,
    .resize-note,
    .menu-tabs small {
      display: none;
    }

    .menu-body {
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(0, 1fr);
    }

    .menu-sidebar {
      padding: 0.65rem 0.8rem;
      border-right: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.055);
    }

    .menu-tabs {
      grid-template-columns: repeat(3, 1fr);
    }

    .menu-tabs button {
      grid-template-columns: auto auto;
      min-height: 2.9rem;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.35rem;
      text-align: center;
    }

    .tab-icon {
      width: 2rem;
      height: 2rem;
      font-size: 1rem;
    }

    .menu-workspace {
      padding: 1.15rem 1rem 1rem;
    }

    .view-heading {
      padding-bottom: 0.9rem;
    }
  }
</style>
