<script lang="ts">
  import type { Phase } from "$lib/features/timer/types";
  import type { RitualSettingsPatch, WatchMode } from "$lib/features/settings/types";

  /** Data comes from SettingsStore; callbacks describe user intent to NibblesApp. */
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
    watchMode, rules, lastExternalTitle, detectionSupported, focusMinutes, breakMinutes,
    overtimeEnabled, growthEvery, minimizeAfter, finalPopEvery, onSetWatchMode, onAddRule,
    onRemoveRule, onUseObservedWindow, onUpdateDuration, onSettingsChange, onPreviewForm
  }: Props = $props();

  let ruleDraft = $state("");

  function submitRule() {
    if (!ruleDraft.trim()) return;
    onAddRule(ruleDraft);
    ruleDraft = "";
  }
</script>

<div class="menu-view settings-view" id="settings-view" role="tabpanel" aria-label="Settings">
  <!-- Foreground-window matching rules -->
  <section class="setting-section first-section">
    <div class="section-heading"><h2>Window rules</h2><span class:status-live={detectionSupported}><i></i>{detectionSupported ? "watching" : "desktop only"}</span></div>
    <div class="mode-switch" role="group" aria-label="Window rule mode">
      <button class:chosen={watchMode === "whitelist"} onclick={() => onSetWatchMode("whitelist")}>Whitelist</button>
      <button class:chosen={watchMode === "blacklist"} onclick={() => onSetWatchMode("blacklist")}>Blacklist</button>
    </div>
    <p class="help-copy">{watchMode === "whitelist" ? "Nibbles stays calm only in matching windows." : "Nibbles reacts whenever a matching window is open."}</p>
    <div class="rule-entry">
      <input bind:value={ruleDraft} onkeydown={(event) => event.key === "Enter" && submitRule()} placeholder="App or tab-title phrase" aria-label="Window title phrase" />
      <button onclick={submitRule} aria-label="Add rule" title="Add rule"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></button>
    </div>
    <div class="chips" aria-label="Window title rules">
      {#each rules as rule}<button class="chip" onclick={() => onRemoveRule(rule)} title="Remove rule">{rule}<span>×</span></button>{/each}
    </div>
    {#if lastExternalTitle}
      <button class="observed-title" onclick={onUseObservedWindow} title="Add this exact title"><span><small>LAST WINDOW</small>{lastExternalTitle}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></button>
    {/if}
  </section>

  <!-- Focus/break duration and overtime behavior -->
  <section class="setting-section">
    <div class="section-heading"><h2>Timer</h2><span>minutes</span></div>
    <div class="settings-grid timer-grid">
      <label><span>Focus</span><input type="number" min="1" max="180" value={focusMinutes} onchange={(event) => onUpdateDuration("focus", Number(event.currentTarget.value))} /><small>min</small></label>
      <label><span>Break</span><input type="number" min="1" max="90" value={breakMinutes} onchange={(event) => onUpdateDuration("break", Number(event.currentTarget.value))} /><small>min</small></label>
    </div>
    <label class="toggle-row"><span><b>Flow overtime</b><small>Keep counting when focus ends.</small></span><input type="checkbox" checked={overtimeEnabled} onchange={(event) => onSettingsChange({ overtimeEnabled: event.currentTarget.checked })} /></label>
  </section>

  <!-- Timing of escalating creature and native window responses -->
  <section class="setting-section">
    <div class="section-heading"><h2>Distraction response</h2><span>forms 2–4</span></div>
    <div class="settings-grid response-grid">
      <label><span>Grow every</span><select value={growthEvery} onchange={(event) => onSettingsChange({ growthEvery: Number(event.currentTarget.value) })}><option value={5}>5 sec</option><option value={10}>10 sec</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>60 sec</option></select></label>
      <label><span>Minimize after final</span><select value={minimizeAfter} onchange={(event) => onSettingsChange({ minimizeAfter: Number(event.currentTarget.value) })}><option value={0}>Never</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>1 min</option><option value={120}>2 min</option></select></label>
      <label><span>Final pop-up</span><select value={finalPopEvery} onchange={(event) => onSettingsChange({ finalPopEvery: Number(event.currentTarget.value) })}><option value={-1}>With growth</option><option value={0}>Never</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>1 min</option></select></label>
    </div>
  </section>

  <!-- Preview is temporary and does not affect real distraction state. -->
  <div class="form-preview" aria-label="Preview warning forms"><span>Preview forms</span>{#each [0, 1, 2, 3] as stage}<button onclick={() => onPreviewForm(stage)} aria-label={`Preview form ${stage + 1}`}>{stage + 1}</button>{/each}</div>
</div>

<style>
  /* Scroll container and repeated settings-section layout */
  .menu-view { min-height: 0; flex: 1 1 auto; padding-right: 3px; overflow: auto; scrollbar-width: thin; scrollbar-color: #633048 transparent; }
  .setting-section { padding: 13px 0; border-top: 1px solid rgba(255,255,255,.06); }
  .setting-section.first-section { padding-top: 9px; border-top: 0; }
  .section-heading, .toggle-row, .observed-title, .form-preview { display: flex; align-items: center; }
  .section-heading { justify-content: space-between; }
  h2 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 1.15rem; font-weight: 600; }
  .section-heading > span { color: #ad818b; font-size: .72rem; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
  .section-heading > span i { display: inline-block; width: 5px; height: 5px; margin-right: 5px; border-radius: 50%; background: #6c5860; }
  .section-heading > span.status-live i { background: #82b38d; box-shadow: 0 0 7px rgba(130,179,141,.55); }
  button { border: 0; color: inherit; cursor: pointer; }
  .mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin: 10px 0 7px; padding: 3px; border-radius: 999px; background: rgba(0,0,0,.27); }
  .mode-switch button { padding: 7px; border-radius: 999px; background: transparent; color: #a88d91; font-size: .82rem; }
  .mode-switch button.chosen { background: linear-gradient(120deg,#7f2941,#4e182f); color: #fff0e9; box-shadow: 0 3px 12px rgba(57,5,24,.35); }
  .help-copy { margin: 5px 0 9px; color: #a38b8f; font-size: .82rem; line-height: 1.38; }
  /* Rule input, removable chips, and last-observed title */
  .rule-entry { display: grid; grid-template-columns: 1fr 34px; gap: 6px; }
  input, select { min-width: 0; border: 1px solid rgba(255,255,255,.08); outline: 0; background: rgba(0,0,0,.25); color: #f1dcda; }
  input:focus, select:focus { border-color: rgba(207,79,102,.55); box-shadow: 0 0 0 3px rgba(159,37,64,.13); }
  .rule-entry input { width: 100%; padding: 9px 11px; border-radius: 11px; font-size: .84rem; }
  .rule-entry > button { display: grid; padding: 0; place-items: center; border-radius: 11px; background: linear-gradient(145deg, #8d2c49, #5e1937); color: #ffeae7; }
  .rule-entry > button svg, .observed-title > svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
  .chip { padding: 5px 8px; border: 1px solid rgba(255,255,255,.07); border-radius: 999px; background: rgba(255,255,255,.05); color: #d5bfbd; font-size: .73rem; }
  .chip span { margin-left: 5px; color: #91616f; }
  .observed-title { width: 100%; justify-content: space-between; gap: 10px; margin-top: 9px; padding: 7px 9px; border-radius: 10px; background: rgba(106,30,51,.15); text-align: left; }
  .observed-title span { min-width: 0; overflow: hidden; font-size: .58rem; text-overflow: ellipsis; white-space: nowrap; }
  .observed-title small { display: block; margin-bottom: 1px; color: #87636d; font-size: .45rem; font-weight: 800; letter-spacing: .12em; }
  .observed-title > svg { flex: 0 0 auto; color: #d58b99; }
  /* Timer and distraction-response form grids */
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 9px; }
  .settings-grid label { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 4px; padding: 8px 9px; border: 1px solid rgba(255,255,255,.055); border-radius: 11px; color: #b79fa0; font-size: .77rem; }
  .response-grid { grid-template-columns: 1fr 1fr; }
  .response-grid label:last-child { grid-column: 1 / -1; }
  .settings-grid input { width: 39px; padding: 4px; border-radius: 6px; text-align: right; }
  .settings-grid select { max-width: 90px; padding: 5px; border-radius: 6px; font-size: .7rem; }
  .settings-grid small { color: #705e64; }
  .toggle-row { justify-content: space-between; gap: 15px; margin-top: 8px; padding: 9px 2px 0; border-top: 1px solid rgba(255,255,255,.05); }
  .toggle-row span, .toggle-row b, .toggle-row small { display: block; }
  .toggle-row b { font-family: Georgia, "Times New Roman", serif; font-size: .96rem; }
  .toggle-row small { margin-top: 2px; color: #a08b8e; font-size: .7rem; }
  .toggle-row input { width: 31px; height: 17px; accent-color: #932f4a; }
  .form-preview { justify-content: flex-end; gap: 5px; color: #927b82; font-size: .64rem; }
  .form-preview span { margin-right: auto; }
  .form-preview button { display: grid; width: 23px; height: 23px; padding: 0; place-items: center; border-radius: 50%; background: rgba(255,255,255,.06); color: #b28c94; font-size: .55rem; }
</style>
