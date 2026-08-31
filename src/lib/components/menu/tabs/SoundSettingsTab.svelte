<script lang="ts">
  import type { AmbientStyle, SoundSettingsPatch, TickStyle } from "$lib/features/settings/types";

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
    tickEnabled, breakMusicEnabled, soundVolume, tickStyle, ambientStyle,
    ambientPreviewing, onSettingsChange, onPreviewTick, onToggleAmbientPreview
  }: Props = $props();
</script>

<div class="menu-view sound-view" id="sound-view" role="tabpanel" aria-label="Sound settings">
  <div class="sound-intro">
    <span aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M6 11v6h4l5 4V7l-5 4H6Z"/><path d="M19 10a6 6 0 0 1 0 8M22 7a10 10 0 0 1 0 14"/></svg></span>
    <div><h2>A rhythm for every ritual</h2><p>Quiet ticks for focus. A soft, shifting soundscape for breaks.</p></div>
  </div>

  <section class="sound-card">
    <header class="sound-card-heading">
      <span class="sound-kind focus-sound" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></span>
      <span><strong>Focus ticking</strong><small>Only while productive time is moving.</small></span>
      <input type="checkbox" checked={tickEnabled} onchange={(event) => onSettingsChange({ tickEnabled: event.currentTarget.checked })} aria-label="Enable focus ticking" />
    </header>
    <div class="sound-controls">
      <label><span>Character</span><select value={tickStyle} onchange={(event) => onSettingsChange({ tickStyle: event.currentTarget.value as TickStyle })} disabled={!tickEnabled}><option value="soft">Soft</option><option value="classic">Classic clock</option><option value="wood">Warm wood</option></select></label>
      <button class="sound-preview" onclick={onPreviewTick} disabled={!tickEnabled || soundVolume === 0} aria-label="Preview ticking sound" title="Preview tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z"/></svg></button>
    </div>
  </section>

  <section class="sound-card">
    <header class="sound-card-heading">
      <span class="sound-kind break-sound" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M17.5 16.5A8 8 0 0 1 7.5 6.5a8 8 0 1 0 10 10Z"/><path d="m17 6 .4 1.2L19 8l-1.6.8L17 10l-.4-1.2L15 8l1.6-.8L17 6Z"/></svg></span>
      <span><strong>Break soundscape</strong><small>Calm music during the break phase.</small></span>
      <input type="checkbox" checked={breakMusicEnabled} onchange={(event) => onSettingsChange({ breakMusicEnabled: event.currentTarget.checked })} aria-label="Enable break music" />
    </header>
    <div class="sound-controls">
      <label><span>Mood</span><select value={ambientStyle} onchange={(event) => onSettingsChange({ ambientStyle: event.currentTarget.value as AmbientStyle })} disabled={!breakMusicEnabled}><option value="moonlit">Moonlit</option><option value="dreaming">Dreaming</option><option value="deep">Deep quiet</option></select></label>
      <button class:active={ambientPreviewing} class="sound-preview" onclick={onToggleAmbientPreview} disabled={!breakMusicEnabled || soundVolume === 0} aria-label={ambientPreviewing ? "Stop break music preview" : "Preview break music"} title={ambientPreviewing ? "Stop preview" : "Preview music"}>
        {#if ambientPreviewing}<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="8" height="8" rx="1.5"/></svg>{:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z"/></svg>{/if}
      </button>
    </div>
  </section>

  <section class="volume-card">
    <div class="volume-heading"><span>Master volume</span><output>{soundVolume}%</output></div>
    <div class="volume-control">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5"/></svg>
      <!-- Input events provide immediate feedback while dragging the volume thumb. -->
      <input type="range" min="0" max="100" step="1" value={soundVolume} oninput={(event) => onSettingsChange({ soundVolume: Number(event.currentTarget.value) })} aria-label="Master sound volume" />
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/></svg>
    </div>
  </section>

  <p class="sound-note"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5a6.5 6.5 0 1 0 6.5 6.5M10 7v3.5M10 14h.01"/></svg>Ticks stop during distractions and pauses. Break music fades out when focus resumes.</p>
</div>

<style>
  .menu-view { min-height: 0; flex: 1 1 auto; padding-right: 3px; overflow: auto; scrollbar-width: thin; scrollbar-color: #633048 transparent; }
  .sound-view { padding: 11px 3px 5px 0; }
  h2 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 1.08rem; font-weight: 600; }
  .sound-intro { display: flex; align-items: center; gap: 12px; padding: 8px 5px 15px; }
  .sound-intro > span { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(245,121,139,.14); border-radius: 14px; background: radial-gradient(circle at 35% 30%, rgba(177,53,81,.3), rgba(67,15,40,.24)); color: #e06679; box-shadow: inset 0 1px rgba(255,255,255,.04), 0 8px 22px rgba(0,0,0,.17); }
  .sound-intro svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 1.45; stroke-linecap: round; stroke-linejoin: round; }
  .sound-intro p { margin: 3px 0 0; color: #9e888d; font-size: .7rem; line-height: 1.4; }
  .sound-card { margin-bottom: 9px; padding: 12px; border: 1px solid rgba(255,255,255,.06); border-radius: 15px; background: linear-gradient(145deg, rgba(255,255,255,.035), rgba(0,0,0,.09)); }
  .sound-card-heading { display: grid; grid-template-columns: 35px minmax(0,1fr) auto; align-items: center; gap: 9px; }
  .sound-kind { display: grid; width: 35px; height: 35px; place-items: center; border-radius: 11px; }
  .sound-kind svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.45; stroke-linecap: round; stroke-linejoin: round; }
  .focus-sound { background: rgba(165,39,67,.15); color: #ed5a73; }
  .break-sound { background: rgba(91,136,121,.14); color: #91b9aa; }
  .sound-card-heading > span:nth-child(2), .sound-card-heading strong, .sound-card-heading small { display: block; min-width: 0; }
  .sound-card-heading strong { color: #e3cecb; font-family: Georgia, "Times New Roman", serif; font-size: .91rem; font-weight: 600; }
  .sound-card-heading small { overflow: hidden; margin-top: 2px; color: #917a80; font-size: .64rem; text-overflow: ellipsis; white-space: nowrap; }
  .sound-card-heading input { width: 31px; height: 17px; accent-color: #9b304c; }
  .sound-controls { display: grid; grid-template-columns: 1fr 33px; gap: 7px; margin-top: 10px; }
  .sound-controls label { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; min-width: 0; padding: 6px 8px 6px 10px; border: 1px solid rgba(255,255,255,.055); border-radius: 10px; background: rgba(0,0,0,.13); color: #a78f94; font-size: .7rem; }
  select { min-width: 0; border: 1px solid rgba(255,255,255,.08); outline: 0; background: rgba(0,0,0,.25); color: #f1dcda; }
  select:focus { border-color: rgba(207,79,102,.55); box-shadow: 0 0 0 3px rgba(159,37,64,.13); }
  .sound-controls select { max-width: 116px; padding: 5px 7px; border-radius: 7px; color: #d8c1bf; font-size: .69rem; }
  .sound-controls select:disabled { opacity: .45; }
  button { border: 0; color: inherit; cursor: pointer; }
  .sound-preview { display: grid; width: 33px; height: 33px; padding: 0; place-items: center; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; background: rgba(107,27,50,.34); color: #dca9ae; transition: 130ms ease; }
  .sound-preview:hover, .sound-preview:focus-visible, .sound-preview.active { border-color: rgba(239,102,122,.28); background: rgba(143,37,61,.62); color: #fff0eb; }
  .sound-preview:disabled { cursor: default; opacity: .32; }
  .sound-preview svg { width: 15px; height: 15px; fill: currentColor; stroke: none; }
  .volume-card { padding: 12px 13px; border: 1px solid rgba(255,255,255,.055); border-radius: 15px; background: rgba(0,0,0,.1); }
  .volume-heading { display: flex; align-items: center; justify-content: space-between; color: #b9a1a2; font-size: .7rem; font-weight: 700; }
  .volume-heading output { color: #e3c8c7; font-variant-numeric: tabular-nums; }
  .volume-control { display: grid; grid-template-columns: 17px 1fr 17px; align-items: center; gap: 8px; margin-top: 8px; color: #876c74; }
  .volume-control svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.45; stroke-linecap: round; stroke-linejoin: round; }
  .volume-control input { width: 100%; height: 4px; padding: 0; border: 0; border-radius: 999px; outline: 0; background: rgba(255,255,255,.09); accent-color: #c84261; }
  .sound-note { display: flex; align-items: flex-start; gap: 7px; margin: 11px 6px 0; color: #806c72; font-size: .62rem; line-height: 1.4; }
  .sound-note svg { width: 15px; height: 15px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
</style>
