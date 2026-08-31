<script lang="ts">
  import type { NibblesApp } from "$lib/app/nibbles.svelte";
  import MenuUI from "./MenuUI.svelte";
  import WidgetUI from "./WidgetUI.svelte";

  let { app }: { app: NibblesApp } = $props();
</script>

<!-- This is the single visual entry point. Mode-specific layout lives below it. -->
<main class="app-ui">
  {#if app.settingsOpen}
    <MenuUI {app} />
  {:else}
    <WidgetUI {app} />
  {/if}
</main>

<style>
  :global(:root) {
    --color-text: #f7e8e3;
    --color-text-muted: #a38b8f;
    --color-accent: #ed4e68;
    --color-surface: rgba(25, 10, 23, 0.97);
    --color-border: rgba(255, 235, 230, 0.1);
    --font-body: "Trebuchet MS", "Segoe UI", sans-serif;
    --font-display: Georgia, "Times New Roman", serif;
    --radius-control: 0.75rem;
    --transition-fast: 130ms ease;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    width: 100%;
    min-width: 100%;
    min-height: 100%;
    margin: 0;
    overflow: hidden;
    background: transparent !important;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: 14px;
  }

  :global(button),
  :global(input),
  :global(select) {
    font: inherit;
  }

  :global(button) {
    border: 0;
    color: inherit;
    cursor: pointer;
  }

  :global(button:disabled) {
    cursor: default;
  }

  .app-ui {
    width: 100vw;
    height: 100vh;
    background: transparent;
  }
</style>
