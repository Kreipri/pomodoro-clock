<script lang="ts">
  import { onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  // A handle to the current native Tauri window.
  const appWindow = getCurrentWindow();

  // Keeps track of whether the window should stay above other windows.
  let pinned = $state(true);

  // Read the real native window state when the interface loads.
  onMount(() => {
    updatePinnedState();
  });

  async function updatePinnedState() {
    try {
      pinned = await appWindow.isAlwaysOnTop();
    } catch (error) {
      console.error("Could not read always-on-top state:", error);
    }
  }

  /*
   * Move the native window.
   *
   * The function ignores:
   * - Right and middle mouse buttons
   * - Clicks on buttons
   */
  async function startDragging(event: PointerEvent) {
    if (event.button !== 0) return;

    const clickedElement = event.target as HTMLElement;

    // Don't drag when the user is trying to press a button.
    if (clickedElement.closest("button")) return;

    try {
      event.preventDefault();
      await appWindow.startDragging();
    } catch (error) {
      console.error("Could not drag window:", error);
    }
  }

  // Toggle whether the clock stays above other windows.
  async function togglePinned() {
    const nextValue = !pinned;

    try {
      await appWindow.setAlwaysOnTop(nextValue);
      pinned = nextValue;
    } catch (error) {
      console.error("Could not change always-on-top state:", error);
    }
  }

  // Close the application window.
  async function closeWindow() {
    await appWindow.close();
  }

  // Hide the window in the taskbar.
  async function minimizeWindow() {
    await appWindow.minimize();
  }
</script>

<svelte:head>
  <title>Pomodoro Clock</title>
</svelte:head>

<main>
  <h1>Pomodoro Clock</h1>

  <section
    aria-labelledby="session-name"
    aria-describedby="timer-help"
    onpointerdown={startDragging}
  >
    <!-- These controls manage the desktop window, not the timer. -->
    <nav aria-label="Window controls">
      <button
        type="button"
        aria-label={pinned ? "Disable always on top" : "Enable always on top"}
        aria-pressed={pinned}
        title={pinned ? "Always on top: on" : "Always on top: off"}
        onclick={togglePinned}
      >
        {pinned ? "Unpin" : "Pin"}
      </button>

      <button type="button" onclick={minimizeWindow}>Minimize</button>
      <button type="button" onclick={closeWindow}>Close</button>
    </nav>

    <!-- JavaScript will update the time shown here later. -->
    <div>
      <h2 id="session-name">Focus session</h2>
      <p id="timer-display" role="timer" aria-live="off">25:00</p>
      <p id="timer-help">Choose a timer control below.</p>

      <!-- type="button" prevents these buttons from submitting a form. -->
      <div role="group" aria-label="Timer controls">
        <button id="start-timer" type="button">Start</button>
        <button id="pause-timer" type="button">Pause</button>
        <button id="stop-timer" type="button">Stop</button>
      </div>
    </div>
  </section>
</main>
