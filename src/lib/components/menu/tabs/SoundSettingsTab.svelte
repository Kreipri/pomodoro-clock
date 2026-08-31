<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import type {
    AmbientStyle,
    SoundSettingsPatch,
    TickStyle
  } from "$lib/features/settings/types";

  /** Audio behavior lives elsewhere; this component only presents its controls. */
  type Props = {
    tickEnabled: boolean;
    breakMusicEnabled: boolean;
    soundVolume: number;
    tickStyle: TickStyle;
    ambientStyle: AmbientStyle;
    ambientPreviewing: boolean;
    onSettingsChange: (patch: SoundSettingsPatch) => void;
    onPreviewTick: () => void;
    onToggleAmbientPreview: () => void;
  };

  let {
    tickEnabled,
    breakMusicEnabled,
    soundVolume,
    tickStyle,
    ambientStyle,
    ambientPreviewing,
    onSettingsChange,
    onPreviewTick,
    onToggleAmbientPreview
  }: Props = $props();
</script>

<div class="menu-view" id="sound-view" role="tabpanel" aria-label="Sound settings">
  <div class="sound-intro">
    <span class="intro-icon" aria-hidden="true">
      <Icon name="sound" />
    </span>
    <div>
      <h2>A rhythm for every ritual</h2>
      <p>Quiet ticks for focus. A soft, shifting soundscape for breaks.</p>
    </div>
  </div>

  <!-- Focus tick controls. -->
  <section class="sound-card">
    <header class="sound-card-heading">
      <span class="sound-kind focus-sound" aria-hidden="true">
        <Icon name="clock" />
      </span>
      <span class="sound-copy">
        <strong>Focus ticking</strong>
        <small>Only while productive time is moving.</small>
      </span>
      <input
        type="checkbox"
        checked={tickEnabled}
        onchange={(event) =>
          onSettingsChange({ tickEnabled: event.currentTarget.checked })}
        aria-label="Enable focus ticking"
      />
    </header>

    <div class="sound-controls">
      <label>
        <span>Character</span>
        <select
          value={tickStyle}
          onchange={(event) =>
            onSettingsChange({ tickStyle: event.currentTarget.value as TickStyle })}
          disabled={!tickEnabled}
        >
          <option value="soft">Soft</option>
          <option value="classic">Classic clock</option>
          <option value="wood">Warm wood</option>
        </select>
      </label>

      <button
        class="sound-preview"
        onclick={onPreviewTick}
        disabled={!tickEnabled || soundVolume === 0}
        aria-label="Preview ticking sound"
        title="Preview tick"
      >
        <Icon name="play" filled />
      </button>
    </div>
  </section>

  <!-- Break soundscape controls. -->
  <section class="sound-card">
    <header class="sound-card-heading">
      <span class="sound-kind break-sound" aria-hidden="true">
        <Icon name="moon" />
      </span>
      <span class="sound-copy">
        <strong>Break soundscape</strong>
        <small>Calm music during the break phase.</small>
      </span>
      <input
        type="checkbox"
        checked={breakMusicEnabled}
        onchange={(event) =>
          onSettingsChange({ breakMusicEnabled: event.currentTarget.checked })}
        aria-label="Enable break music"
      />
    </header>

    <div class="sound-controls">
      <label>
        <span>Mood</span>
        <select
          value={ambientStyle}
          onchange={(event) =>
            onSettingsChange({
              ambientStyle: event.currentTarget.value as AmbientStyle
            })}
          disabled={!breakMusicEnabled}
        >
          <option value="moonlit">Moonlit</option>
          <option value="dreaming">Dreaming</option>
          <option value="deep">Deep quiet</option>
        </select>
      </label>

      <button
        class="sound-preview"
        class:active={ambientPreviewing}
        onclick={onToggleAmbientPreview}
        disabled={!breakMusicEnabled || soundVolume === 0}
        aria-label={ambientPreviewing ? "Stop break music preview" : "Preview break music"}
        title={ambientPreviewing ? "Stop preview" : "Preview music"}
      >
        <Icon name={ambientPreviewing ? "stop" : "play"} filled />
      </button>
    </div>
  </section>

  <!-- Both sound families share this master volume. -->
  <section class="volume-card">
    <div class="volume-heading">
      <span>Master volume</span>
      <output>{soundVolume}%</output>
    </div>

    <div class="volume-control">
      <Icon name="volume-low" />
      <!-- Input provides immediate feedback while the slider is moving. -->
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={soundVolume}
        oninput={(event) =>
          onSettingsChange({ soundVolume: Number(event.currentTarget.value) })}
        aria-label="Master sound volume"
      />
      <Icon name="volume-high" />
    </div>
  </section>

  <p class="sound-note">
    <Icon name="info" />
    <span>
      Ticks stop during distractions and pauses. Break music fades out when focus resumes.
    </span>
  </p>
</div>

<style>
  .menu-view {
    width: 100%;
    padding: 0.6875rem 0 0.3125rem;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.08rem;
    font-weight: 600;
  }

  .sound-intro {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.3125rem 0.9375rem;
  }

  .intro-icon {
    display: grid;
    width: 2.625rem;
    height: 2.625rem;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid rgba(245, 121, 139, 0.14);
    border-radius: 0.875rem;
    background: radial-gradient(
      circle at 35% 30%,
      rgba(177, 53, 81, 0.3),
      rgba(67, 15, 40, 0.24)
    );
    color: #e06679;
    font-size: 1.4375rem;
    box-shadow:
      inset 0 1px rgba(255, 255, 255, 0.04),
      0 0.5rem 1.375rem rgba(0, 0, 0, 0.17);
  }

  .sound-intro p {
    margin: 0.1875rem 0 0;
    color: #9e888d;
    font-size: 0.7rem;
    line-height: 1.4;
  }

  .sound-card {
    margin-bottom: 0.5625rem;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.9375rem;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.035),
      rgba(0, 0, 0, 0.09)
    );
  }

  .sound-card-heading {
    display: grid;
    grid-template-columns: 2.1875rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5625rem;
  }

  .sound-kind {
    display: grid;
    width: 2.1875rem;
    height: 2.1875rem;
    place-items: center;
    border-radius: 0.6875rem;
    font-size: 1.125rem;
  }

  .focus-sound {
    background: rgba(165, 39, 67, 0.15);
    color: #ed5a73;
  }

  .break-sound {
    background: rgba(91, 136, 121, 0.14);
    color: #91b9aa;
  }

  .sound-copy,
  .sound-copy strong,
  .sound-copy small {
    display: block;
    min-width: 0;
  }

  .sound-copy strong {
    color: #e3cecb;
    font-family: var(--font-display);
    font-size: 0.91rem;
    font-weight: 600;
  }

  .sound-copy small {
    overflow: hidden;
    margin-top: 0.125rem;
    color: #917a80;
    font-size: 0.64rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sound-card-heading input {
    width: 1.9375rem;
    height: 1.0625rem;
    accent-color: #9b304c;
  }

  .sound-controls {
    display: grid;
    grid-template-columns: 1fr 2.0625rem;
    gap: 0.4375rem;
    margin-top: 0.625rem;
  }

  .sound-controls label {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.375rem 0.5rem 0.375rem 0.625rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 0.625rem;
    background: rgba(0, 0, 0, 0.13);
    color: #a78f94;
    font-size: 0.7rem;
  }

  select {
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    outline: 0;
    background: rgba(0, 0, 0, 0.25);
    color: #f1dcda;
  }

  select:focus {
    border-color: rgba(207, 79, 102, 0.55);
    box-shadow: 0 0 0 0.1875rem rgba(159, 37, 64, 0.13);
  }

  .sound-controls select {
    max-width: 7.25rem;
    padding: 0.3125rem 0.4375rem;
    border-radius: 0.4375rem;
    color: #d8c1bf;
    font-size: 0.69rem;
  }

  .sound-controls select:disabled {
    opacity: 0.45;
  }

  .sound-preview {
    display: grid;
    width: 2.0625rem;
    height: 2.0625rem;
    padding: 0;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.625rem;
    background: rgba(107, 27, 50, 0.34);
    color: #dca9ae;
    font-size: 0.9375rem;
    transition: var(--transition-fast);
  }

  .sound-preview:hover,
  .sound-preview:focus-visible,
  .sound-preview.active {
    border-color: rgba(239, 102, 122, 0.28);
    background: rgba(143, 37, 61, 0.62);
    color: #fff0eb;
  }

  .sound-preview:disabled {
    cursor: default;
    opacity: 0.32;
  }

  .volume-card {
    padding: 0.75rem 0.8125rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 0.9375rem;
    background: rgba(0, 0, 0, 0.1);
  }

  .volume-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #b9a1a2;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .volume-heading output {
    color: #e3c8c7;
    font-variant-numeric: tabular-nums;
  }

  .volume-control {
    display: grid;
    grid-template-columns: 1.0625rem 1fr 1.0625rem;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    color: #876c74;
    font-size: 1.0625rem;
  }

  .volume-control input {
    width: 100%;
    height: 0.25rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    outline: 0;
    background: rgba(255, 255, 255, 0.09);
    accent-color: #c84261;
  }

  .sound-note {
    display: flex;
    align-items: flex-start;
    gap: 0.4375rem;
    margin: 0.6875rem 0.375rem 0;
    color: #806c72;
    font-size: 0.62rem;
    line-height: 1.4;
  }

  .sound-note :global(svg) {
    flex: 0 0 auto;
    font-size: 0.9375rem;
  }
</style>
