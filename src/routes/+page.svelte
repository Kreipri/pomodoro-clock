<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

  type Phase = "focus" | "break";

  const appWindow = (
    "__TAURI_INTERNALS__" in window
      ? getCurrentWindow()
      : {
          setTitle: async () => {},
          setSize: async () => {},
          center: async () => {},
          isAlwaysOnTop: async () => true,
          setAlwaysOnTop: async () => {},
          startDragging: async () => {},
          minimize: async () => {},
          close: async () => {}
        }
  ) as ReturnType<typeof getCurrentWindow>;
  const DEFAULT_RULES = ["Figma", "Google Docs", "Notion", "Visual Studio Code"];

  let phase = $state<Phase>("focus");
  let secondsLeft = $state(25 * 60);
  let running = $state(false);
  let completedFocuses = $state(0);
  let focusMinutes = $state(25);
  let breakMinutes = $state(5);

  let whitelist = $state<string[]>([...DEFAULT_RULES]);
  let ruleDraft = $state("");
  let graceSeconds = $state(8);
  let growthEvery = $state(10);
  let settingsOpen = $state(false);

  let activeTitle = $state("Waiting for a window…");
  let lastExternalTitle = $state("");
  let isAllowed = $state(true);
  let distractionSeconds = $state(0);
  let dangerStage = $state(0);
  let previewStage = $state(0);
  let detectionSupported = $state(true);
  let pinned = $state(true);

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let monitorInterval: ReturnType<typeof setInterval> | null = null;

  const minutes = $derived(Math.floor(secondsLeft / 60));
  const seconds = $derived(secondsLeft % 60);
  const displayTime = $derived(
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  );
  const effectiveStage = $derived(Math.max(dangerStage, previewStage));
  const phaseLabel = $derived(phase === "focus" ? "Feeding time" : "Digesting");
  const monitorActive = $derived(running && phase === "focus");
  const statusText = $derived.by(() => {
    if (!detectionSupported) return "Window watching is available in the desktop app.";
    if (!running) return "Nibbles is waiting for a focus session.";
    if (phase === "break") return "A well-fed familiar deserves a little rest.";
    if (isAllowed) return "Good. The little void is being fed.";
    if (distractionSeconds <= graceSeconds) {
      return `That window is not on the menu. ${graceSeconds - distractionSeconds + 1}s to return.`;
    }
    if (dangerStage === 3) return "FINAL FORM — return to an allowed window!";
    return "Nibbles is hungry. Return before it grows again.";
  });

  $effect(() => {
    appWindow.setTitle(`${displayTime} · ${phaseLabel} · Nibbles`).catch(() => {});
  });

  $effect(() => {
    const stage = effectiveStage;
    void resizeForStage(stage);
  });

  function startTimer() {
    running = true;
  }

  function pauseTimer() {
    running = false;
    clearDistraction();
  }

  function resetTimer() {
    pauseTimer();
    secondsLeft = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  }

  function skipPhase() {
    finishPhase();
  }

  function finishPhase() {
    if (phase === "focus") {
      completedFocuses += 1;
      phase = "break";
      secondsLeft = breakMinutes * 60;
    } else {
      phase = "focus";
      secondsLeft = focusMinutes * 60;
    }
    clearDistraction();
    persistSettings();
  }

  function tick() {
    if (!running) return;

    if (secondsLeft > 0) secondsLeft -= 1;
    else finishPhase();

    if (phase !== "focus" || isAllowed) {
      clearDistraction();
      return;
    }

    distractionSeconds += 1;
    if (distractionSeconds > graceSeconds) {
      dangerStage = Math.min(
        3,
        1 + Math.floor((distractionSeconds - graceSeconds - 1) / growthEvery)
      );
    }
  }

  function clearDistraction() {
    distractionSeconds = 0;
    dangerStage = 0;
  }

  function isWhitelisted(title: string) {
    const normalized = title.trim().toLocaleLowerCase();
    if (!normalized || normalized.includes("nibbles")) return true;
    return whitelist.some((rule) => normalized.includes(rule.toLocaleLowerCase()));
  }

  async function pollForegroundWindow() {
    try {
      const title = await invoke<string>("get_foreground_window_title");
      detectionSupported = true;
      activeTitle = title || "Untitled window";
      if (title && !title.toLocaleLowerCase().includes("nibbles")) {
        lastExternalTitle = title;
      }
      isAllowed = isWhitelisted(title);
    } catch {
      detectionSupported = false;
      isAllowed = true;
      clearDistraction();
    }
  }

  async function resizeForStage(stage: number) {
    try {
      const screenWidth = window.screen.availWidth || 1280;
      const screenHeight = window.screen.availHeight || 800;
      const sizes = [
        [390, 520],
        [470, 570],
        [Math.min(650, screenWidth * 0.68), Math.min(680, screenHeight * 0.78)],
        [Math.min(980, screenWidth * 0.9), Math.min(820, screenHeight * 0.9)]
      ];
      const [width, height] = sizes[stage];
      await appWindow.setSize(new LogicalSize(Math.round(width), Math.round(height)));
      if (stage > 1) await appWindow.center();
    } catch {
      // Browser preview: the card still grows even when no native window exists.
    }
  }

  function addRule(value = ruleDraft) {
    const nextRule = value.trim();
    if (!nextRule) return;
    if (!whitelist.some((rule) => rule.toLocaleLowerCase() === nextRule.toLocaleLowerCase())) {
      whitelist = [...whitelist, nextRule];
    }
    ruleDraft = "";
    isAllowed = isWhitelisted(activeTitle);
    persistSettings();
  }

  function removeRule(rule: string) {
    whitelist = whitelist.filter((item) => item !== rule);
    isAllowed = isWhitelisted(activeTitle);
    persistSettings();
  }

  function allowObservedWindow() {
    if (lastExternalTitle) addRule(lastExternalTitle);
  }

  function updateDuration(kind: Phase, value: number) {
    const safeValue = Math.max(1, Math.min(120, value || 1));
    if (kind === "focus") focusMinutes = safeValue;
    else breakMinutes = safeValue;
    if (!running && phase === kind) secondsLeft = safeValue * 60;
    persistSettings();
  }

  function persistSettings() {
    localStorage.setItem(
      "nibbles-settings",
      JSON.stringify({ whitelist, graceSeconds, growthEvery, focusMinutes, breakMinutes, completedFocuses })
    );
  }

  function restoreSettings() {
    try {
      const saved = localStorage.getItem("nibbles-settings");
      if (!saved) return;
      const data = JSON.parse(saved);
      if (Array.isArray(data.whitelist)) whitelist = data.whitelist;
      if ([5, 8, 15].includes(data.graceSeconds)) graceSeconds = data.graceSeconds;
      if ([10, 20, 30].includes(data.growthEvery)) growthEvery = data.growthEvery;
      if (Number.isFinite(data.focusMinutes)) focusMinutes = data.focusMinutes;
      if (Number.isFinite(data.breakMinutes)) breakMinutes = data.breakMinutes;
      if (Number.isFinite(data.completedFocuses)) completedFocuses = data.completedFocuses;
      secondsLeft = focusMinutes * 60;
    } catch {
      // Ignore malformed local settings and retain the friendly defaults.
    }
  }

  async function togglePinned() {
    try {
      pinned = !pinned;
      await appWindow.setAlwaysOnTop(pinned);
    } catch {}
  }

  function toggleSettings() {
    settingsOpen = !settingsOpen;
    if (!settingsOpen) previewStage = 0;
  }

  function previewNextForm() {
    previewStage = (previewStage + 1) % 4;
    settingsOpen = false;
  }

  async function startDragging(event: PointerEvent) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, input, select")) return;
    event.preventDefault();
    try {
      await appWindow.startDragging();
    } catch {}
  }

  onMount(() => {
    restoreSettings();
    appWindow.isAlwaysOnTop().then((value) => (pinned = value)).catch(() => {});
    timerInterval = setInterval(tick, 1000);
    monitorInterval = setInterval(pollForegroundWindow, 900);
    void pollForegroundWindow();
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (monitorInterval) clearInterval(monitorInterval);
  });
</script>

<svelte:head>
  <title>Nibbles · Productivity Familiar</title>
  <meta name="description" content="A tiny eldritch Pomodoro familiar that feeds on focused work." />
</svelte:head>

<main class:awakened={effectiveStage > 0} class:final-form={effectiveStage === 3}>
  <section class="shell" onpointerdown={startDragging} aria-label="Nibbles focus timer">
    <header>
      <div class="brand">
        <span class="brand-eye" aria-hidden="true"></span>
        <div><p class="eyebrow">PRODUCTIVITY FAMILIAR</p><h1>Nibbles</h1></div>
      </div>
      <nav aria-label="Window controls">
        <button class="icon-button" class:active={pinned} onclick={togglePinned} aria-label="Toggle always on top" title="Always on top">⌖</button>
        <button class="icon-button" onclick={toggleSettings} aria-label="Open settings" aria-pressed={settingsOpen}>⚙</button>
        <button class="icon-button" onclick={() => appWindow.minimize()} aria-label="Minimize">—</button>
        <button class="icon-button close" onclick={() => appWindow.close()} aria-label="Close">×</button>
      </nav>
    </header>

    {#if settingsOpen}
      <div class="settings-panel">
        <div class="settings-heading">
          <div><p class="eyebrow">HOUSE RULES</p><h2>What can Nibbles eat?</h2></div>
          <button class="text-button" onclick={toggleSettings}>Done</button>
        </div>
        <p class="explanation">Add a word from an app or browser-tab title. Matches are not case-sensitive.</p>
        <div class="rule-entry">
          <input bind:value={ruleDraft} onkeydown={(event) => event.key === "Enter" && addRule()} placeholder="e.g. Google Docs" aria-label="Allowed title keyword" />
          <button class="add-button" onclick={() => addRule()}>Add</button>
        </div>
        <div class="chips" aria-label="Allowed title keywords">
          {#each whitelist as rule}
            <button class="chip" onclick={() => removeRule(rule)} title="Remove rule">{rule}<span>×</span></button>
          {/each}
        </div>
        {#if lastExternalTitle}
          <div class="observed">
            <span><small>LAST SEEN</small>{lastExternalTitle}</span>
            <button onclick={allowObservedWindow}>Allow exact title</button>
          </div>
        {/if}
        <div class="settings-grid">
          <label>Focus<input type="number" min="1" max="120" value={focusMinutes} onchange={(event) => updateDuration("focus", Number(event.currentTarget.value))} /><span>min</span></label>
          <label>Break<input type="number" min="1" max="60" value={breakMinutes} onchange={(event) => updateDuration("break", Number(event.currentTarget.value))} /><span>min</span></label>
          <label>Grace<select bind:value={graceSeconds} onchange={persistSettings}><option value={5}>5 sec</option><option value={8}>8 sec</option><option value={15}>15 sec</option></select></label>
          <label>Growth<select bind:value={growthEvery} onchange={persistSettings}><option value={10}>10 sec</option><option value={20}>20 sec</option><option value={30}>30 sec</option></select></label>
        </div>
        <div class="preview-row">
          <span>Preview its forms without starting a session.</span>
          <button class="secondary-button" onclick={previewNextForm}>Next form</button>
        </div>
      </div>
    {:else}
      <div class="creature-zone stage-{effectiveStage}" aria-hidden="true">
        <div class="aura"></div><div class="creature-sprite"></div>
        {#if effectiveStage > 0}<span class="alert-rune rune-one">✦</span>{/if}
        {#if effectiveStage > 1}<span class="alert-rune rune-two">◌</span>{/if}
      </div>
      <div class="timer-block">
        <div class="phase-row">
          <span class:focus={phase === "focus"}>{phaseLabel}</span>
          <div class="cycle-pips" aria-label={`${completedFocuses} completed focus sessions`}>
            {#each Array(4) as _, index}<i class:filled={index < completedFocuses % 4}></i>{/each}
          </div>
        </div>
        <p class="timer" role="timer" aria-label={`${minutes} minutes ${seconds} seconds`}>{displayTime}</p>
        <p class="status" class:danger={!isAllowed && monitorActive}>{statusText}</p>
      </div>
      <div class="controls" role="group" aria-label="Timer controls">
        <button class="secondary-button" onclick={resetTimer}>Reset</button>
        <button class="primary-button" onclick={running ? pauseTimer : startTimer}>{running ? "Pause feeding" : "Start feeding"}</button>
        <button class="secondary-button" onclick={skipPhase}>Skip</button>
      </div>
      <div class="window-status" class:blocked={!isAllowed && monitorActive}>
        <span class="status-dot"></span>
        <div><small>{monitorActive ? "WATCHING" : "MONITOR ASLEEP"}</small><strong>{monitorActive ? activeTitle : "Start a focus session to wake it"}</strong></div>
      </div>
    {/if}
  </section>
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html), :global(body) { margin: 0; min-width: 100%; min-height: 100%; background: transparent; color: #f7e9df; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  :global(button), :global(input), :global(select) { font: inherit; }
  :global(button) { color: inherit; }
  main { min-height: 100vh; padding: 10px; background: transparent; }
  .shell { position: relative; min-height: calc(100vh - 20px); overflow: hidden; padding: 18px; border: 1px solid rgba(255, 220, 211, 0.13); border-radius: 28px; background: radial-gradient(circle at 50% 20%, rgba(113, 28, 42, 0.25), transparent 40%), linear-gradient(155deg, rgba(29, 18, 28, 0.98), rgba(10, 7, 12, 0.99)); box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55), inset 0 1px rgba(255,255,255,0.05); }
  .shell::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.22; background-image: radial-gradient(rgba(246, 219, 210, 0.6) 0.5px, transparent 0.5px); background-size: 7px 7px; mask-image: linear-gradient(to bottom, black, transparent 70%); }
  header, .settings-heading, .phase-row, .controls, .window-status, .preview-row, .observed { display: flex; align-items: center; }
  header { position: relative; z-index: 5; justify-content: space-between; gap: 12px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand h1, .settings-heading h2 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 600; letter-spacing: -0.02em; }
  .brand h1 { font-size: 1.25rem; }
  .eyebrow { margin: 0 0 2px; color: #a98d8d; font-size: 0.58rem; font-weight: 800; letter-spacing: 0.18em; }
  .brand-eye { position: relative; width: 32px; height: 23px; border-radius: 70% 30% 70% 30%; rotate: 45deg; background: #e8c8c4; box-shadow: 0 0 18px rgba(224, 91, 105, 0.22); }
  .brand-eye::after { content: ""; position: absolute; inset: 5px 13px; border-radius: 100%; background: #7e1429; rotate: -45deg; }
  nav { display: flex; gap: 3px; }
  button { border: 0; cursor: pointer; }
  .icon-button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; border-radius: 50%; background: rgba(255,255,255,0.055); color: #bca8a5; transition: 160ms ease; }
  .icon-button:hover, .icon-button.active { color: #fff2ea; background: rgba(255,255,255,0.12); }
  .icon-button.close:hover { background: #762033; }
  .creature-zone { position: relative; display: grid; height: clamp(170px, 39vh, 270px); margin: 4px auto -10px; place-items: center; transition: 400ms ease; }
  .creature-sprite { position: relative; z-index: 2; width: min(82vw, 270px); aspect-ratio: 1; background-image: url('/creature-sprites.png'); background-repeat: no-repeat; background-size: 200% 200%; filter: drop-shadow(0 15px 18px rgba(0,0,0,0.55)); animation: float 3.6s ease-in-out infinite; transition: width 500ms cubic-bezier(.2,.8,.2,1); }
  .stage-0 .creature-sprite { width: min(70vw, 230px); background-position: 0% 0%; }
  .stage-1 .creature-sprite { width: min(78vw, 300px); background-position: 100% 0%; animation-duration: 2.4s; }
  .stage-2 .creature-sprite { width: min(72vw, 430px); background-position: 0% 100%; animation-duration: 1.8s; }
  .stage-3 .creature-sprite { width: min(88vw, 680px); background-position: 100% 100%; animation: pulse 1.4s ease-in-out infinite; }
  .final-form .creature-zone { height: clamp(270px, 52vh, 510px); margin-top: -22px; margin-bottom: -48px; }
  .aura { position: absolute; width: min(64vw, 250px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(173,34,55,.22), rgba(83,15,37,.08) 48%, transparent 70%); filter: blur(3px); animation: breathe 3s ease-in-out infinite; }
  .awakened .aura { width: min(78vw, 520px); background: radial-gradient(circle, rgba(206,43,66,.3), rgba(83,15,37,.08) 50%, transparent 72%); }
  .alert-rune { position: absolute; color: #be5363; text-shadow: 0 0 16px #ad263e; animation: orbit 5s linear infinite; }
  .rune-one { top: 26%; left: 14%; }
  .rune-two { right: 12%; bottom: 30%; animation-direction: reverse; }
  .timer-block { position: relative; z-index: 3; text-align: center; }
  .phase-row { justify-content: center; gap: 13px; color: #d8beb7; font-size: .72rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
  .phase-row .focus { color: #edb5b5; }
  .cycle-pips { display: flex; gap: 4px; }
  .cycle-pips i { width: 5px; height: 5px; border-radius: 50%; background: #4f3f46; }
  .cycle-pips i.filled { background: #d05668; box-shadow: 0 0 8px #a92440; }
  .timer { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(3.2rem, 16vw, 5rem); line-height: 1.02; font-variant-numeric: tabular-nums; letter-spacing: -.055em; text-shadow: 0 8px 28px rgba(0,0,0,.4); }
  .status { min-height: 2.2em; max-width: 520px; margin: 5px auto 12px; color: #a99391; font-size: .75rem; }
  .status.danger { color: #ef9eaa; }
  .controls { position: relative; z-index: 3; justify-content: center; gap: 8px; }
  .primary-button, .secondary-button, .add-button, .text-button, .observed button { border-radius: 999px; transition: transform 140ms ease, background 140ms ease; }
  .primary-button { min-width: 142px; padding: 11px 20px; background: linear-gradient(180deg, #97314a, #691d34); box-shadow: 0 8px 24px rgba(104,20,43,.36), inset 0 1px rgba(255,255,255,.16); font-weight: 750; }
  .secondary-button { padding: 9px 13px; background: rgba(255,255,255,.065); color: #c8b3af; font-size: .72rem; }
  .primary-button:hover, .secondary-button:hover, .add-button:hover { transform: translateY(-1px); filter: brightness(1.12); }
  .window-status { position: relative; z-index: 3; gap: 9px; max-width: 520px; margin: 14px auto 0; padding: 9px 11px; border: 1px solid rgba(255,255,255,.06); border-radius: 12px; background: rgba(0,0,0,.18); overflow: hidden; }
  .window-status div { min-width: 0; }
  .window-status small, .window-status strong { display: block; }
  .window-status small { margin-bottom: 2px; color: #74666b; font-size: .5rem; font-weight: 800; letter-spacing: .15em; }
  .window-status strong { overflow: hidden; color: #a99593; font-size: .66rem; font-weight: 550; text-overflow: ellipsis; white-space: nowrap; }
  .status-dot { flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; background: #526c5b; box-shadow: 0 0 8px #526c5b; }
  .window-status.blocked .status-dot { background: #cf425b; box-shadow: 0 0 9px #cf425b; animation: blink .8s steps(2) infinite; }
  .settings-panel { position: relative; z-index: 4; max-width: 540px; margin: 22px auto 0; }
  .settings-heading { justify-content: space-between; }
  .settings-heading h2 { font-size: 1.45rem; }
  .text-button { padding: 7px 12px; background: transparent; color: #dc9fac; font-size: .73rem; }
  .explanation { color: #9b8586; font-size: .74rem; line-height: 1.45; }
  .rule-entry { display: grid; grid-template-columns: 1fr auto; gap: 7px; }
  input, select { min-width: 0; border: 1px solid rgba(255,255,255,.09); outline: none; background: rgba(0,0,0,.25); color: #f3ded8; }
  .rule-entry input { width: 100%; padding: 10px 13px; border-radius: 11px; }
  input:focus, select:focus { border-color: rgba(213,79,103,.65); box-shadow: 0 0 0 3px rgba(174,42,69,.12); }
  .add-button { padding: 0 16px; background: #78243b; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
  .chip { padding: 6px 9px 6px 11px; border: 1px solid rgba(255,255,255,.07); border-radius: 999px; background: rgba(255,255,255,.055); color: #d5c0bb; font-size: .68rem; }
  .chip span { margin-left: 7px; color: #976f77; }
  .observed { justify-content: space-between; gap: 12px; padding: 9px 11px; border-radius: 11px; background: rgba(119,31,55,.13); }
  .observed span { min-width: 0; overflow: hidden; font-size: .66rem; text-overflow: ellipsis; white-space: nowrap; }
  .observed small { display: block; margin-bottom: 2px; color: #8d7076; font-size: .48rem; font-weight: 800; letter-spacing: .14em; }
  .observed button { flex: 0 0 auto; padding: 6px 9px; background: rgba(255,255,255,.075); color: #deb9b7; font-size: .62rem; }
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
  .settings-grid label { position: relative; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 5px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.055); border-radius: 11px; color: #a99190; font-size: .68rem; }
  .settings-grid input { width: 42px; padding: 4px; border-radius: 6px; text-align: right; }
  .settings-grid select { max-width: 72px; padding: 4px; border-radius: 6px; }
  .settings-grid label span { color: #6e5f63; }
  .preview-row { justify-content: space-between; gap: 12px; margin-top: 14px; color: #857276; font-size: .67rem; }
  .final-form .shell { border-color: rgba(205,54,78,.34); box-shadow: 0 28px 90px rgba(35,0,10,.8), inset 0 0 80px rgba(93,15,37,.2); }
  .final-form .timer { color: #ffe8e0; }
  @keyframes float { 0%,100% { transform: translateY(4px) rotate(-1deg); } 50% { transform: translateY(-7px) rotate(1deg); } }
  @keyframes pulse { 0%,100% { transform: scale(.98) rotate(-.6deg); } 50% { transform: scale(1.02) rotate(.6deg); } }
  @keyframes breathe { 0%,100% { scale: .94; opacity: .65; } 50% { scale: 1.06; opacity: 1; } }
  @keyframes orbit { to { transform: rotate(360deg) translateX(12px) rotate(-360deg); } }
  @keyframes blink { 50% { opacity: .3; } }
  @media (max-height: 560px) { .creature-zone { height: 155px; margin-top: -5px; } .creature-sprite { width: 205px; } .window-status { margin-top: 9px; } }
</style>
