<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";

  type Props = {
    pinned: boolean;
    onStartDragging: (event: PointerEvent) => void;
    onToggleMenu: () => void;
    onTogglePinned: () => void;
    onMinimize: () => void;
    onClose: () => void;
  };

  let {
    pinned,
    onStartDragging,
    onToggleMenu,
    onTogglePinned,
    onMinimize,
    onClose
  }: Props = $props();
</script>

<!-- Empty header space acts as the frameless window's native drag handle. -->
<header class="window-header" onpointerdown={onStartDragging} role="presentation">
  <nav class="window-actions" aria-label="Window controls">
    <button
      class="icon-button"
      onclick={onToggleMenu}
      aria-label="Open menu"
      title="Menu"
    >
      <Icon name="menu" />
    </button>

    <button
      class="icon-button"
      class:active={pinned}
      onclick={onTogglePinned}
      aria-label={pinned ? "Unpin window" : "Pin window on top"}
      title={pinned ? "Unpin" : "Pin on top"}
    >
      <Icon name="pin" />
    </button>

    <button
      class="icon-button"
      onclick={onMinimize}
      aria-label="Minimize Nibbles"
      title="Minimize"
    >
      <Icon name="minimize" />
    </button>

    <button
      class="icon-button danger-button"
      onclick={onClose}
      aria-label="Close Nibbles"
      title="Close"
    >
      <Icon name="close" />
    </button>
  </nav>
</header>

<style>
  .window-header {
    width: 100%;
    height: 100%;
  }

  .window-actions {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
    display: flex;
    gap: 0.25rem;
  }

  .icon-button {
    display: grid;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    place-items: center;
    border: 1px solid rgba(255, 235, 231, 0.1);
    border-radius: 50%;
    background: linear-gradient(145deg, rgba(46, 17, 31, 0.8), rgba(16, 7, 16, 0.72));
    color: rgba(247, 224, 220, 0.72);
    font-size: 0.95rem;
    box-shadow: 0 0.3rem 0.875rem rgba(0, 0, 0, 0.23);
    backdrop-filter: blur(8px);
    transition: var(--transition-fast);
  }

  .icon-button:hover,
  .icon-button:focus-visible,
  .icon-button.active {
    border-color: rgba(230, 146, 153, 0.34);
    background: linear-gradient(145deg, rgba(111, 30, 50, 0.9), rgba(41, 10, 27, 0.84));
    color: #fff4ef;
    transform: translateY(-1px);
  }

  .danger-button:hover {
    background: #741d34;
  }

  @media (max-width: 430px), (max-height: 390px) {
    .window-actions {
      top: 0.45rem;
      right: 0.45rem;
    }
  }
</style>
