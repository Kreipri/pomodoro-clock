<script lang="ts">
  /** Native-window actions are callbacks so this component never imports Tauri APIs. */
  type Props = {
    pinned: boolean;
    menuOpen: boolean;
    onStartDragging: (event: PointerEvent) => void;
    onToggleMenu: () => void;
    onTogglePinned: () => void;
    onMinimize: () => void;
    onClose: () => void;
  };

  let {
    pinned,
    menuOpen,
    onStartDragging,
    onToggleMenu,
    onTogglePinned,
    onMinimize,
    onClose
  }: Props = $props();
</script>

<!-- The empty part of this header is the frameless window's native drag handle. -->
<header class:hidden={menuOpen} class="window-header" onpointerdown={onStartDragging} role="presentation">
  <nav class="window-actions" aria-label="Window controls">
    <button class="icon-button" onclick={onToggleMenu} aria-label="Open menu" aria-pressed={menuOpen} title="Menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <button class:active={pinned} class="icon-button" onclick={onTogglePinned} aria-label={pinned ? "Unpin window" : "Pin window on top"} title={pinned ? "Unpin" : "Pin on top"}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l-1 4 3 3v1H7v-1l3-3-1-4ZM12 12v7" /></svg>
    </button>
    <button class="icon-button" onclick={onMinimize} aria-label="Minimize Nibbles" title="Minimize">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15h12" /></svg>
    </button>
    <button class="icon-button danger-button" onclick={onClose} aria-label="Close Nibbles" title="Close">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
    </button>
  </nav>
</header>

<style>
  /* The transparent full-width header is both hover target and native drag region. */
  .window-header { position: absolute; z-index: 20; inset: 0 50px 40px 0; height: 48px; opacity: 0; transition: opacity 150ms ease; }
  .window-header.hidden { display: none; }
  :global(.familiar:hover) .window-header, :global(.familiar:focus-within) .window-header { opacity: 1; }
  .window-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }
  button { border: 0; cursor: pointer; }
  .icon-button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; border: 1px solid rgba(255,235,231,.1); border-radius: 50%; background: linear-gradient(145deg, rgba(46,17,31,.8), rgba(16,7,16,.72)); color: rgba(247,224,220,.72); box-shadow: 0 5px 14px rgba(0,0,0,.23); backdrop-filter: blur(8px); transition: 130ms ease; }
  .icon-button svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .icon-button:hover, .icon-button:focus-visible, .icon-button.active { border-color: rgba(230,146,153,.34); color: #fff4ef; background: linear-gradient(145deg, rgba(111,30,50,.9), rgba(41,10,27,.84)); transform: translateY(-1px); }
  .danger-button:hover { background: #741d34; }
  @media (max-width: 430px), (max-height: 390px) { .window-actions { top: 7px; right: 7px; } }
</style>
