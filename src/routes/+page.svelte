<script lang="ts">
  // onMount runs once after the component first appears on screen.
  // onDestroy runs when the component is removed (e.g. app closes).
  import { onMount, onDestroy } from "svelte";

  // This gives us access to the native desktop window (provided by Tauri).
  import { getCurrentWindow } from "@tauri-apps/api/window";

  // Get a reference to the current app window so we can move, pin, or close it.
  const appWindow = getCurrentWindow();

  // ---------------------------------------------------------------------------
  // Window pin state
  // ---------------------------------------------------------------------------

  // $state() makes this variable "reactive" — whenever it changes, any part of
  // the template that uses it will automatically re-render.
  let pinned = $state(true);

  // ---------------------------------------------------------------------------
  // Timer configuration
  // ---------------------------------------------------------------------------

  // A Pomodoro cycle is: 4 focus sessions separated by short breaks, followed
  // by one long break. We store each session as an object with a human-readable
  // label and a duration in minutes.
  //
  // "as const" tells TypeScript to treat the values as exact literals (e.g. 25)
  // rather than just "number", which helps catch typos at compile time.
  const SESSIONS = [
    { label: "Focus session", minutes: 25 },
    { label: "Short break",   minutes:  5 },
    { label: "Focus session", minutes: 25 },
    { label: "Short break",   minutes:  5 },
    { label: "Focus session", minutes: 25 },
    { label: "Short break",   minutes:  5 },
    { label: "Focus session", minutes: 25 },
    { label: "Long break",    minutes: 15 },
  ] as const;

  // ---------------------------------------------------------------------------
  // Timer state
  // ---------------------------------------------------------------------------

  // Which session we are currently on (0 = first Focus session).
  let sessionIndex = $state(0);

  // How many seconds are left in the current session.
  // We multiply minutes × 60 to convert to seconds.
  let secondsLeft = $state(SESSIONS[0].minutes * 60);

  // Whether the countdown is actively ticking.
  let running = $state(false);

  // A reference to the repeating interval so we can cancel it later.
  // This is null when the timer is not running.
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  // $derived() computes a value from other reactive state. It re-runs
  // automatically whenever its dependencies (sessionIndex, secondsLeft) change.

  // The current session object, e.g. { label: "Focus session", minutes: 25 }.
  const currentSession = $derived(SESSIONS[sessionIndex]);

  // Break secondsLeft into whole minutes and leftover seconds for display.
  const minutes = $derived(Math.floor(secondsLeft / 60));
  const seconds = $derived(secondsLeft % 60);

  // Format the time as "MM:SS", padding single digits with a leading zero
  // so "5 minutes, 3 seconds" shows as "05:03" instead of "5:3".
  const displayTime = $derived(
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  );

  // ---------------------------------------------------------------------------
  // Side effect — keep the window title in sync
  // ---------------------------------------------------------------------------

  // $effect() runs whenever its reactive dependencies change.
  // Here, displayTime or currentSession.label changing will cause the native
  // window title to update, so the countdown is visible in the OS taskbar.
  $effect(() => {
    appWindow
      .setTitle(`${displayTime} — ${currentSession.label}`)
      .catch(() => {
        // Silently ignore errors — a missing title is not critical.
      });
  });

  // ---------------------------------------------------------------------------
  // Timer controls
  // ---------------------------------------------------------------------------

  // Start the countdown. Does nothing if it is already running.
  function startTimer() {
    if (running) return;

    running = true;

    // setInterval calls tick() every 1000 milliseconds (1 second).
    // It returns an ID we can use later to cancel the interval.
    intervalId = setInterval(tick, 1000);
  }

  // Pause the countdown without resetting the time.
  function pauseTimer() {
    if (!running) return;

    running = false;

    // clearInterval cancels the repeating tick using the ID we saved earlier.
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Stop the countdown and reset the current session back to its full duration.
  function stopTimer() {
    // Pause first so the interval is cleaned up.
    pauseTimer();

    // Reset time to the beginning of the current session.
    secondsLeft = currentSession.minutes * 60;
  }

  // Called once per second while the timer is running.
  function tick() {
    if (secondsLeft > 0) {
      // Decrement the counter by one second.
      secondsLeft -= 1;
    } else {
      // The session has ended — move on to the next one automatically.
      advanceSession();
    }
  }

  // Move to the next session in the SESSIONS list and immediately start it.
  function advanceSession() {
    // Stop the current interval before changing state.
    pauseTimer();

    // The % (modulo) operator wraps the index back to 0 after the last session,
    // so the cycle repeats indefinitely.
    sessionIndex = (sessionIndex + 1) % SESSIONS.length;

    // Reset the clock for the new session.
    secondsLeft = SESSIONS[sessionIndex].minutes * 60;

    // Kick off the new session straight away.
    startTimer();
  }

  // Cancel the interval when the component is torn down to avoid memory leaks.
  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  });

  // ---------------------------------------------------------------------------
  // Window management
  // ---------------------------------------------------------------------------

  // Read the actual always-on-top state from the OS when the app first loads,
  // so our UI matches reality (the OS state is the source of truth).
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

  // Allow the user to drag the window by clicking anywhere that is not a button.
  async function startDragging(event: PointerEvent) {
    // Only respond to the primary (left) mouse button.
    if (event.button !== 0) return;

    // If the user clicked on or inside a button, let the button handle it.
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.closest("button")) return;

    try {
      // Prevent the browser from treating this as a text selection drag.
      event.preventDefault();
      await appWindow.startDragging();
    } catch (error) {
      console.error("Could not drag window:", error);
    }
  }

  // Toggle whether the window floats above all other windows.
  async function togglePinned() {
    const nextValue = !pinned;

    try {
      await appWindow.setAlwaysOnTop(nextValue);
      // Only update our local state after the OS call succeeds.
      pinned = nextValue;
    } catch (error) {
      console.error("Could not change always-on-top state:", error);
    }
  }

  // Close the application.
  async function closeWindow() {
    await appWindow.close();
  }

  // Minimise the window to the taskbar.
  async function minimizeWindow() {
    await appWindow.minimize();
  }
</script>

<!-- svelte:head lets us set <head> tags (like the page title) from inside a
     component without touching app.html directly. -->
<svelte:head>
  <title>Pomodoro Clock</title>
</svelte:head>

<main>
  <div class="background-shape"></div>
  <h1>Pomodoro Clock</h1>

  <!--
    aria-labelledby points to the <h2> that names this section.
    aria-describedby points to the help text below the timer.
    onpointerdown starts the window drag when the user clicks the background.
  -->
  <section
    aria-labelledby="session-name"
    aria-describedby="timer-help"
    onpointerdown={startDragging}
  >
    <!-- Window control buttons — these affect the OS window, not the timer. -->
    <nav aria-label="Window controls">
      <!--
        aria-pressed tells screen readers this is a toggle button and whether
        it is currently active (true) or inactive (false).
      -->
      <button
        type="button"
        aria-label={pinned ? "Disable always on top" : "Enable always on top"}
        aria-pressed={pinned}
        title={pinned ? "Always on top: on" : "Always on top: off"}
        onclick={togglePinned}
      >
        <!-- The label flips automatically because pinned is reactive. -->
        {pinned ? "Unpin" : "Pin"}
      </button>

      <button type="button" onclick={minimizeWindow}>Minimize</button>
      <button type="button" onclick={closeWindow}>Close</button>
    </nav>

    <div>
      <!-- currentSession.label updates reactively when sessions advance. -->
      <h2 id="session-name">{currentSession.label}</h2>

      <!--
        role="timer" tells assistive technology this is a live countdown.
        aria-live="off" means the screen reader won't interrupt the user every
        second — they can navigate to it when they want to hear the time.
        aria-label gives a spoken version: "24 minutes 53 seconds".
      -->
      <p
        id="timer-display"
        role="timer"
        aria-live="off"
        aria-label="{minutes} minutes {seconds} seconds"
      >
        {displayTime}
      </p>

      <!-- Status text that tells the user what the timer is doing. -->
      <p id="timer-help">
        {running ? "Timer is running." : "Choose a timer control below."}
      </p>

      <!--
        role="group" + aria-label bundles the three buttons together so screen
        readers announce "Timer controls: Start, Pause, Stop" as a unit.

        disabled={running}  — Start is greyed out while the timer ticks.
        disabled={!running} — Pause is greyed out while the timer is stopped.
        Stop is always available so the user can reset at any time.
      -->
      <div role="group" aria-label="Timer controls">
        <button
          id="start-timer"
          type="button"
          disabled={running}
          onclick={startTimer}
        >Start</button>

        <button
          id="pause-timer"
          type="button"
          disabled={!running}
          onclick={pauseTimer}
        >Pause</button>

        <button
          id="stop-timer"
          type="button"
          onclick={stopTimer}
        >Stop</button>
      </div>
    </div>
  </section>
</main>

<style>
  main {
    position: relative;
    overflow: hidden;
  }

  .background-shape {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #ff6b6b 0%, #ee5a6f 100%);
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    z-index: -1;
    opacity: 0.3;
  }
</style>
