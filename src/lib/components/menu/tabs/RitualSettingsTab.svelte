<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import type { Phase } from "$lib/features/timer/types";
  import type { RitualSettingsPatch, WatchMode } from "$lib/features/settings/types";

  /** Settings data flows in; callbacks report a user's requested change. */
  type Props = {
    watchMode: WatchMode;
    rules: string[];
    lastExternalTitle: string;
    detectionSupported: boolean;
    focusMinutes: number;
    breakMinutes: number;
    overtimeEnabled: boolean;
    growthEvery: number;
    minimizeAfter: number;
    finalPopEvery: number;
    onSetWatchMode: (mode: WatchMode) => void;
    onAddRule: (rule: string) => void;
    onRemoveRule: (rule: string) => void;
    onUseObservedWindow: () => void;
    onUpdateDuration: (phase: Phase, minutes: number) => void;
    onSettingsChange: (patch: RitualSettingsPatch) => void;
    onPreviewForm: (stage: number) => void;
  };

  let {
    watchMode,
    rules,
    lastExternalTitle,
    detectionSupported,
    focusMinutes,
    breakMinutes,
    overtimeEnabled,
    growthEvery,
    minimizeAfter,
    finalPopEvery,
    onSetWatchMode,
    onAddRule,
    onRemoveRule,
    onUseObservedWindow,
    onUpdateDuration,
    onSettingsChange,
    onPreviewForm
  }: Props = $props();

  let ruleDraft = $state("");

  /** Ignore empty rules and clear the field after a successful request. */
  function submitRule() {
    if (!ruleDraft.trim()) return;

    onAddRule(ruleDraft);
    ruleDraft = "";
  }
</script>

<div class="menu-view" id="settings-view" role="tabpanel" aria-label="Settings">
  <!-- Foreground-window matching rules. -->
  <section class="setting-section first-section">
    <div class="section-heading">
      <h2>Window rules</h2>
      <span class:status-live={detectionSupported}>
        <i></i>
        {detectionSupported ? "watching" : "desktop only"}
      </span>
    </div>

    <div class="mode-switch" role="group" aria-label="Window rule mode">
      <button
        class:chosen={watchMode === "whitelist"}
        onclick={() => onSetWatchMode("whitelist")}
      >
        Whitelist
      </button>
      <button
        class:chosen={watchMode === "blacklist"}
        onclick={() => onSetWatchMode("blacklist")}
      >
        Blacklist
      </button>
    </div>

    <p class="help-copy">
      {watchMode === "whitelist"
        ? "Nibbles stays calm only in matching windows."
        : "Nibbles reacts whenever a matching window is open."}
    </p>

    <div class="rule-entry">
      <input
        bind:value={ruleDraft}
        onkeydown={(event) => event.key === "Enter" && submitRule()}
        placeholder="App or tab-title phrase"
        aria-label="Window title phrase"
      />
      <button onclick={submitRule} aria-label="Add rule" title="Add rule">
        <Icon name="plus" />
      </button>
    </div>

    <div class="chips" aria-label="Window title rules">
      {#each rules as rule}
        <button class="chip" onclick={() => onRemoveRule(rule)} title="Remove rule">
          {rule}
          <span>×</span>
        </button>
      {/each}
    </div>

    {#if lastExternalTitle}
      <button
        class="observed-title"
        onclick={onUseObservedWindow}
        title="Add this exact title"
      >
        <span>
          <small>LAST WINDOW</small>
          {lastExternalTitle}
        </span>
        <Icon name="plus" />
      </button>
    {/if}
  </section>

  <!-- Timer durations and what happens after a focus session ends. -->
  <section class="setting-section">
    <div class="section-heading">
      <h2>Timer</h2>
      <span>minutes</span>
    </div>

    <div class="settings-grid timer-grid">
      <label>
        <span>Focus</span>
        <input
          type="number"
          min="1"
          max="180"
          value={focusMinutes}
          onchange={(event) => onUpdateDuration("focus", Number(event.currentTarget.value))}
        />
        <small>min</small>
      </label>

      <label>
        <span>Break</span>
        <input
          type="number"
          min="1"
          max="90"
          value={breakMinutes}
          onchange={(event) => onUpdateDuration("break", Number(event.currentTarget.value))}
        />
        <small>min</small>
      </label>
    </div>

    <label class="toggle-row">
      <span>
        <b>Flow overtime</b>
        <small>Keep counting when focus ends.</small>
      </span>
      <input
        type="checkbox"
        checked={overtimeEnabled}
        onchange={(event) =>
          onSettingsChange({ overtimeEnabled: event.currentTarget.checked })}
      />
    </label>
  </section>

  <!-- Escalation timings control the creature and native window response. -->
  <section class="setting-section">
    <div class="section-heading">
      <h2>Distraction response</h2>
      <span>forms 2–4</span>
    </div>

    <div class="settings-grid response-grid">
      <label>
        <span>Grow every</span>
        <select
          value={growthEvery}
          onchange={(event) =>
            onSettingsChange({ growthEvery: Number(event.currentTarget.value) })}
        >
          <option value={5}>5 sec</option>
          <option value={10}>10 sec</option>
          <option value={15}>15 sec</option>
          <option value={30}>30 sec</option>
          <option value={60}>60 sec</option>
        </select>
      </label>

      <label>
        <span>Minimize after final</span>
        <select
          value={minimizeAfter}
          onchange={(event) =>
            onSettingsChange({ minimizeAfter: Number(event.currentTarget.value) })}
        >
          <option value={0}>Never</option>
          <option value={15}>15 sec</option>
          <option value={30}>30 sec</option>
          <option value={60}>1 min</option>
          <option value={120}>2 min</option>
        </select>
      </label>

      <label>
        <span>Final pop-up</span>
        <select
          value={finalPopEvery}
          onchange={(event) =>
            onSettingsChange({ finalPopEvery: Number(event.currentTarget.value) })}
        >
          <option value={-1}>With growth</option>
          <option value={0}>Never</option>
          <option value={15}>15 sec</option>
          <option value={30}>30 sec</option>
          <option value={60}>1 min</option>
        </select>
      </label>
    </div>
  </section>

  <!-- Previewing a form never changes the real distraction state. -->
  <div class="form-preview" aria-label="Preview warning forms">
    <span>Preview forms</span>
    {#each [0, 1, 2, 3] as stage}
      <button
        onclick={() => onPreviewForm(stage)}
        aria-label={`Preview form ${stage + 1}`}
      >
        {stage + 1}
      </button>
    {/each}
  </div>
</div>

<style>
  .menu-view {
    width: 100%;
  }

  .setting-section {
    padding: 0.8125rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .setting-section.first-section {
    padding-top: 0.5625rem;
    border-top: 0;
  }

  .section-heading,
  .toggle-row,
  .observed-title,
  .form-preview {
    display: flex;
    align-items: center;
  }

  .section-heading {
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 600;
  }

  .section-heading > span {
    color: #ad818b;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .section-heading > span i {
    display: inline-block;
    width: 0.3125rem;
    height: 0.3125rem;
    margin-right: 0.3125rem;
    border-radius: 50%;
    background: #6c5860;
  }

  .section-heading > span.status-live i {
    background: #82b38d;
    box-shadow: 0 0 0.4375rem rgba(130, 179, 141, 0.55);
  }

  .mode-switch {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.1875rem;
    margin: 0.625rem 0 0.4375rem;
    padding: 0.1875rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.27);
  }

  .mode-switch button {
    padding: 0.4375rem;
    border-radius: 999px;
    background: transparent;
    color: #a88d91;
    font-size: 0.82rem;
  }

  .mode-switch button.chosen {
    background: linear-gradient(120deg, #7f2941, #4e182f);
    color: #fff0e9;
    box-shadow: 0 0.1875rem 0.75rem rgba(57, 5, 24, 0.35);
  }

  .help-copy {
    margin: 0.3125rem 0 0.5625rem;
    color: #a38b8f;
    font-size: 0.82rem;
    line-height: 1.38;
  }

  .rule-entry {
    display: grid;
    grid-template-columns: 1fr 2.125rem;
    gap: 0.375rem;
  }

  input,
  select {
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    outline: 0;
    background: rgba(0, 0, 0, 0.25);
    color: #f1dcda;
  }

  input:focus,
  select:focus {
    border-color: rgba(207, 79, 102, 0.55);
    box-shadow: 0 0 0 0.1875rem rgba(159, 37, 64, 0.13);
  }

  .rule-entry input {
    width: 100%;
    padding: 0.5625rem 0.6875rem;
    border-radius: 0.6875rem;
    font-size: 0.84rem;
  }

  .rule-entry > button {
    display: grid;
    padding: 0;
    place-items: center;
    border-radius: 0.6875rem;
    background: linear-gradient(145deg, #8d2c49, #5e1937);
    color: #ffeae7;
    font-size: 0.875rem;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3125rem;
    margin-top: 0.5rem;
  }

  .chip {
    padding: 0.3125rem 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    color: #d5bfbd;
    font-size: 0.73rem;
  }

  .chip span {
    margin-left: 0.3125rem;
    color: #91616f;
  }

  .observed-title {
    width: 100%;
    justify-content: space-between;
    gap: 0.625rem;
    margin-top: 0.5625rem;
    padding: 0.4375rem 0.5625rem;
    border-radius: 0.625rem;
    background: rgba(106, 30, 51, 0.15);
    text-align: left;
  }

  .observed-title span {
    min-width: 0;
    overflow: hidden;
    font-size: 0.58rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .observed-title small {
    display: block;
    margin-bottom: 0.0625rem;
    color: #87636d;
    font-size: 0.45rem;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .observed-title :global(svg) {
    flex: 0 0 auto;
    color: #d58b99;
    font-size: 0.875rem;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4375rem;
    margin-top: 0.5625rem;
  }

  .settings-grid label {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.5625rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 0.6875rem;
    color: #b79fa0;
    font-size: 0.77rem;
  }

  .response-grid {
    grid-template-columns: 1fr 1fr;
  }

  .response-grid label:last-child {
    grid-column: 1 / -1;
  }

  .settings-grid input {
    width: 2.4375rem;
    padding: 0.25rem;
    border-radius: 0.375rem;
    text-align: right;
  }

  .settings-grid select {
    max-width: 5.625rem;
    padding: 0.3125rem;
    border-radius: 0.375rem;
    font-size: 0.7rem;
  }

  .settings-grid small {
    color: #705e64;
  }

  .toggle-row {
    justify-content: space-between;
    gap: 0.9375rem;
    margin-top: 0.5rem;
    padding: 0.5625rem 0.125rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .toggle-row span,
  .toggle-row b,
  .toggle-row small {
    display: block;
  }

  .toggle-row b {
    font-family: var(--font-display);
    font-size: 0.96rem;
  }

  .toggle-row small {
    margin-top: 0.125rem;
    color: #a08b8e;
    font-size: 0.7rem;
  }

  .toggle-row input {
    width: 1.9375rem;
    height: 1.0625rem;
    accent-color: #932f4a;
  }

  .form-preview {
    justify-content: flex-end;
    gap: 0.3125rem;
    color: #927b82;
    font-size: 0.64rem;
  }

  .form-preview span {
    margin-right: auto;
  }

  .form-preview button {
    display: grid;
    width: 1.4375rem;
    height: 1.4375rem;
    padding: 0;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    color: #b28c94;
    font-size: 0.55rem;
  }
</style>
