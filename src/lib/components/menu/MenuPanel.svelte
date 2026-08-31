<script lang="ts">
  import type { Snippet } from "svelte";
  import type { MenuView } from "$lib/types";

  type Props = {
    view: MenuView;
    onViewChange: (view: MenuView) => void;
    onClose: () => void;
    children: Snippet;
  };

  let { view, onViewChange, onClose, children }: Props = $props();

  const titles: Record<MenuView, string> = {
    settings: "Ritual settings",
    sound: "Sound settings",
    activity: "Focus activity"
  };
</script>

<!-- The backdrop closes the modal while the panel owns navigation and layout only. -->
<button class="menu-backdrop" onclick={onClose} aria-label="Close menu"></button>
<section class="settings-panel" aria-label="Nibbles menu">
  <header class="settings-header">
    <div class="menu-title"><p class="kicker">NIBBLES</p><h1>{titles[view]}</h1></div>
    <div class="settings-tools">
      <div class="menu-tabs" role="tablist" aria-label="Menu sections">
        <button role="tab" class:active={view === "settings"} onclick={() => onViewChange("settings")} aria-label="Settings" aria-selected={view === "settings"} aria-controls="settings-view" title="Settings"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.6l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.8 2h-3l-.7 2.4a7 7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.6l-2 .7v3l2 .7a7 7 0 0 0 .7 1.6l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.7.7l.7 2.4h3l.7-2.4a7 7 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .7-1.6Z" transform="translate(2.2 0) scale(.82)"/></svg></button>
        <button role="tab" class:active={view === "sound"} onclick={() => onViewChange("sound")} aria-label="Sound settings" aria-selected={view === "sound"} aria-controls="sound-view" title="Sound settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.7 6.5a7.7 7.7 0 0 1 0 11"/></svg></button>
        <button role="tab" class:active={view === "activity"} onclick={() => onViewChange("activity")} aria-label="Focus activity" aria-selected={view === "activity"} aria-controls="activity-view" title="Focus activity"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V11M12 19V5M19 19v-7"/><path d="M3 19h18"/></svg></button>
      </div>
      <button class="icon-button" onclick={onClose} aria-label="Close menu" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg></button>
    </div>
  </header>

  {@render children()}
</section>

<style>
  .menu-backdrop { position: absolute; z-index: 9; inset: 0; border: 0; background: rgba(6,2,7,.22); backdrop-filter: blur(3px); cursor: default; }
  .settings-panel { position: absolute; z-index: 10; inset: 12px; display: flex; overflow: hidden; padding: 24px; flex-direction: column; border: 1px solid rgba(255,235,230,.1); border-radius: 38px 25px 40px 27px / 30px 41px 27px 39px; background: radial-gradient(circle at 18% 3%, rgba(103,31,50,.34), transparent 31%), linear-gradient(150deg, rgba(25,10,23,.97), rgba(9,5,12,.95)); box-shadow: 0 22px 55px rgba(0,0,0,.52), inset 0 1px rgba(255,255,255,.04); backdrop-filter: blur(14px); }
  .settings-header { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.055); }
  .menu-title { min-width: 0; }
  .kicker { margin: 0 0 2px; color: #b58b94; font-size: .62rem; font-weight: 850; letter-spacing: .16em; }
  h1 { overflow: hidden; margin: 0; color: #f7e8e3; font-family: Georgia, "Times New Roman", serif; font-size: 1.65rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .settings-tools, .menu-tabs { display: flex; align-items: center; }
  .settings-tools { flex: 0 0 auto; gap: 7px; }
  .menu-tabs { gap: 3px; padding: 3px; border: 1px solid rgba(255,255,255,.055); border-radius: 999px; background: rgba(0,0,0,.22); }
  button { border: 0; color: inherit; cursor: pointer; }
  .menu-tabs button { display: grid; width: 27px; height: 27px; padding: 0; place-items: center; border: 1px solid transparent; border-radius: 50%; background: transparent; color: #765f68; transition: 130ms ease; }
  .menu-tabs button:hover, .menu-tabs button:focus-visible { color: #e8ced0; }
  .menu-tabs button.active { border-color: rgba(244,111,130,.2); background: linear-gradient(145deg, rgba(130,34,58,.8), rgba(55,13,34,.83)); color: #fff0ec; box-shadow: 0 3px 10px rgba(38,4,20,.3); }
  .menu-tabs svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.55; stroke-linecap: round; stroke-linejoin: round; }
  .icon-button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; border: 1px solid rgba(255,235,231,.1); border-radius: 50%; background: linear-gradient(145deg, rgba(46,17,31,.8), rgba(16,7,16,.72)); color: rgba(247,224,220,.72); box-shadow: 0 5px 14px rgba(0,0,0,.23); transition: 130ms ease; }
  .icon-button svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .icon-button:hover, .icon-button:focus-visible { border-color: rgba(230,146,153,.34); color: #fff4ef; background: linear-gradient(145deg, rgba(111,30,50,.9), rgba(41,10,27,.84)); transform: translateY(-1px); }
</style>
