<script lang="ts">
  /** Central list of icons used by the widget and menu. */
  export type IconName =
    | "activity"
    | "break"
    | "clock"
    | "close"
    | "focus"
    | "info"
    | "list"
    | "menu"
    | "minimize"
    | "moon"
    | "pin"
    | "play"
    | "plus"
    | "settings"
    | "skip"
    | "sound"
    | "stop"
    | "trend-down"
    | "trend-flat"
    | "trend-up"
    | "volume-high"
    | "volume-low";

  type Props = {
    name: IconName;
    filled?: boolean;
  };

  let { name, filled = false }: Props = $props();

  const viewBox = $derived(
    name.startsWith("trend-") ? "0 0 16 16" :
    ["focus", "break", "list"].includes(name) ? "0 0 20 20" :
    "0 0 24 24"
  );
</script>

<svg {viewBox} class:filled aria-hidden="true" focusable="false">
  {#if name === "activity"}
    <path d="M5 19V11M12 19V5M19 19v-7" />
    <path d="M3 19h18" />
  {:else if name === "break"}
    <path d="M14.8 13.6A6.7 6.7 0 0 1 6.4 5.2a6.7 6.7 0 1 0 8.4 8.4Z" />
  {:else if name === "clock"}
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7v5l3 2" />
  {:else if name === "close"}
    <path d="m7 7 10 10M17 7 7 17" />
  {:else if name === "focus"}
    <circle cx="10" cy="10" r="6.5" />
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 1.5V4M18.5 10H16" />
  {:else if name === "info"}
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5M12 8v4.5M12 16h.01" />
  {:else if name === "list"}
    <path d="M6.5 5h9M6.5 10h9M6.5 15h9" />
    <circle cx="3.5" cy="5" r=".8" />
    <circle cx="3.5" cy="10" r=".8" />
    <circle cx="3.5" cy="15" r=".8" />
  {:else if name === "menu"}
    <path d="M5 7h14M5 12h14M5 17h14" />
  {:else if name === "minimize"}
    <path d="M6 15h12" />
  {:else if name === "moon"}
    <path d="M17.5 16.5A8 8 0 0 1 7.5 6.5a8 8 0 1 0 10 10Z" />
    <path d="m17 6 .4 1.2L19 8l-1.6.8L17 10l-.4-1.2L15 8l1.6-.8L17 6Z" />
  {:else if name === "pin"}
    <path d="M9 4h6l-1 4 3 3v1H7v-1l3-3-1-4ZM12 12v7" />
  {:else if name === "play"}
    <path d="m9 6 9 6-9 6Z" />
  {:else if name === "plus"}
    <path d="M12 5v14M5 12h14" />
  {:else if name === "settings"}
    <circle cx="12" cy="12" r="3" />
    <path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.6l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.8 2h-3l-.7 2.4a7 7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.6l-2 .7v3l2 .7a7 7 0 0 0 .7 1.6l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.7.7l.7 2.4h3l.7-2.4a7 7 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .7-1.6Z" transform="translate(2.2 0) scale(.82)" />
  {:else if name === "skip"}
    <path d="m6 6 6 6-6 6M13 6l6 6-6 6" />
  {:else if name === "sound"}
    <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
    <path d="M15 9.2a4 4 0 0 1 0 5.6M17.7 6.5a7.7 7.7 0 0 1 0 11" />
  {:else if name === "stop"}
    <rect x="8" y="8" width="8" height="8" rx="1.5" />
  {:else if name === "trend-up"}
    <path d="m3 11 4-4 2.5 2.5L13 6" />
    <path d="M9.5 6H13v3.5" />
  {:else if name === "trend-down"}
    <path d="m3 5 4 4 2.5-2.5L13 10" />
    <path d="M9.5 10H13V6.5" />
  {:else if name === "trend-flat"}
    <path d="M3 8h10" />
  {:else if name === "volume-low"}
    <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
    <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
  {:else if name === "volume-high"}
    <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
    <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 1em;
    height: 1em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  svg.filled {
    fill: currentColor;
    stroke: none;
  }
</style>
