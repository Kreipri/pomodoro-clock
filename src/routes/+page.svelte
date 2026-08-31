<script lang="ts">
  import { onMount } from "svelte";
  import { NibblesApp } from "$lib/app/nibbles.svelte";
  import AppUI from "$lib/components/ui/AppUI.svelte";

  const app = new NibblesApp();

  onMount(() => {
    void app.initialize();
    return () => app.dispose();
  });
</script>

<svelte:head>
  <title>Nibbles · Productivity Familiar</title>
  <meta
    name="description"
    content="A summoned eldritch Pomodoro familiar that feasts on productivity."
  />
</svelte:head>

<AppUI {app} />
