<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

  type Phase = "focus" | "break";
  type WatchMode = "whitelist" | "blacklist";
  type MenuView = "settings" | "activity";
  type LogFilter = "all" | Phase;
  type SessionLog = { phase: Phase; completed: boolean; endedAt: number; minutes: number; overtimeSeconds: number; actualSeconds?: number };
  type TrendDay = { key: number; label: string; focusMinutes: number; breakMinutes: number };

  const appWindow = (
    "__TAURI_INTERNALS__" in window ? getCurrentWindow() : {
      setTitle: async () => {}, setSize: async () => {}, center: async () => {},
      isAlwaysOnTop: async () => true, setAlwaysOnTop: async () => {},
      startDragging: async () => {}, minimize: async () => {}, close: async () => {},
      unminimize: async () => {}, show: async () => {}, setFocus: async () => {}
    }
  ) as ReturnType<typeof getCurrentWindow>;

  const DEFAULT_RULES = ["Figma", "Google Docs", "Notion", "Visual Studio Code"];

  let phase = $state<Phase>("focus");
  let secondsLeft = $state(25 * 60);
  let overtimeSeconds = $state(0);
  let running = $state(false);
  let focusMinutes = $state(25);
  let breakMinutes = $state(5);
  let overtimeEnabled = $state(true);
  let completedFocuses = $state(0);
  let sessionLogs = $state<SessionLog[]>([]);
  let phaseElapsedSeconds = $state(0);
  let phaseCompletionLogged = $state(false);
  let logFilter = $state<LogFilter>("all");

  let watchMode = $state<WatchMode>("whitelist");
  let rules = $state<string[]>([...DEFAULT_RULES]);
  let ruleDraft = $state("");
  let growthEvery = $state(15);
  let minimizeAfter = $state(0);
  let finalPopEvery = $state(-1);
  let settingsOpen = $state(false);
  let menuView = $state<MenuView>("settings");

  let activeTitle = $state("Waiting for a window…");
  let lastExternalTitle = $state("");
  let isAllowed = $state(true);
  let distractionSeconds = $state(0);
  let dangerStage = $state(0);
  let previewStage = $state(0);
  let detectionSupported = $state(true);
  let pinned = $state(true);
  let minimizedThisDistraction = $state(false);
  let finalFormSeconds = $state(0);

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let monitorInterval: ReturnType<typeof setInterval> | null = null;
  let previewTimeout: ReturnType<typeof setTimeout> | null = null;

  const effectiveStage = $derived(Math.max(dangerStage, previewStage));
  const monitorActive = $derived(running && phase === "focus");
  const isOvertime = $derived(phase === "focus" && secondsLeft === 0);
  const creatureSource = $derived(
    effectiveStage === 0 ? "/form1_.png?v=figma-forms-2" : effectiveStage === 1 ? "/form2.png?v=figma-forms-2" :
    effectiveStage === 2 ? "/form3.png?v=figma-forms-2" : "/form4.png?v=figma-forms-2"
  );
  const showBook = $derived(running && phase === "focus" && isAllowed && effectiveStage === 0);
  const displayTime = $derived.by(() => {
    const total = isOvertime ? overtimeSeconds : secondsLeft;
    const clock = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    return isOvertime && overtimeSeconds > 0 ? `+${clock}` : clock;
  });
  const timerProgress = $derived.by(() => {
    const plannedSeconds = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
    if (isOvertime) return 1;
    return Math.max(0, Math.min(1, secondsLeft / plannedSeconds));
  });
  const indicatorLabel = $derived.by(() => {
    if (!running) return "IDLE";
    if (phase === "break") return "BREAK";
    if (!isAllowed) return "FOCUS PAUSED";
    if (isOvertime) return "OVERTIME";
    return "FOCUS";
  });
  const distractionLabel = $derived.by(() => {
    if (dangerStage === 3) return "LAST WARNING · RETURN TO YOUR RITUAL";
    if (dangerStage === 2) return "SECOND WARNING · IT IS STILL GROWING";
    return "DISTRACTION DETECTED · TIMER FROZEN";
  });
  const trendDays = $derived.by(() => buildTrendDays(sessionLogs));
  const trendMaximum = $derived(Math.max(1, ...trendDays.flatMap((day) => [day.focusMinutes, day.breakMinutes])));
  const weekFocusMinutes = $derived(trendDays.reduce((total, day) => total + day.focusMinutes, 0));
  const weekBreakMinutes = $derived(trendDays.reduce((total, day) => total + day.breakMinutes, 0));
  const weekCompletedFocuses = $derived(sessionLogs.filter((log) => log.phase === "focus" && log.completed && log.endedAt >= trendDays[0].key).length);
  const trendChange = $derived.by(() => {
    const previous = trendDays.slice(1, 4).reduce((total, day) => total + day.focusMinutes, 0);
    const recent = trendDays.slice(4).reduce((total, day) => total + day.focusMinutes, 0);
    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
  });
  const filteredLogs = $derived(sessionLogs.filter((log) => logFilter === "all" || log.phase === logFilter).slice(0, 12));

  $effect(() => { appWindow.setTitle(`${displayTime} · ${indicatorLabel} · Nibbles`).catch(() => {}); });
  $effect(() => { void resizeForState(effectiveStage, settingsOpen); });

  function toggleTimer() {
    resetPreview();
    running ? pauseTimer() : (running = true);
  }
  function pauseTimer() { running = false; isAllowed = true; clearDistraction(); }
  function stopTimer() {
    pauseTimer(); overtimeSeconds = 0;
    phase = "focus";
    secondsLeft = focusMinutes * 60;
    phaseElapsedSeconds = 0; phaseCompletionLogged = false;
  }
  function skipPhase() { finishPhase(secondsLeft === 0); }

  function finishPhase(completed: boolean) {
    const finishedPhase = phase;
    const plannedMinutes = finishedPhase === "focus" ? focusMinutes : breakMinutes;
    if (phaseCompletionLogged && finishedPhase === "focus") {
      const [finishedSession, ...remainingLogs] = sessionLogs;
      if (finishedSession?.phase === "focus" && finishedSession.completed) {
        sessionLogs = [{ ...finishedSession, overtimeSeconds, actualSeconds: phaseElapsedSeconds, endedAt: Date.now() }, ...remainingLogs];
      }
    } else {
      const finishedSession: SessionLog = {
        phase: finishedPhase,
        completed,
        endedAt: Date.now(),
        minutes: plannedMinutes,
        overtimeSeconds,
        actualSeconds: phaseElapsedSeconds
      };
      sessionLogs = [finishedSession, ...sessionLogs].slice(0, 100);
    }
    if (finishedPhase === "focus") {
      if (completed && !phaseCompletionLogged) completedFocuses += 1;
      phase = "break"; secondsLeft = breakMinutes * 60;
    } else {
      phase = "focus"; secondsLeft = focusMinutes * 60;
    }
    overtimeSeconds = 0; phaseElapsedSeconds = 0; phaseCompletionLogged = false; clearDistraction(); persistSettings();
  }

  function tick() {
    if (!running) return;
    if (phase === "focus" && !isAllowed) { advanceDistraction(); return; }
    if (phase === "focus") clearDistraction();
    if (secondsLeft > 0) { phaseElapsedSeconds += 1; secondsLeft -= 1; return; }
    if (phase === "focus" && overtimeEnabled) {
      if (!phaseCompletionLogged) {
        phaseCompletionLogged = true;
        completedFocuses += 1;
        const completedFocus: SessionLog = { phase: "focus", completed: true, endedAt: Date.now(), minutes: focusMinutes, overtimeSeconds: 0, actualSeconds: phaseElapsedSeconds };
        sessionLogs = [completedFocus, ...sessionLogs].slice(0, 100);
        persistSettings();
      }
      phaseElapsedSeconds += 1; overtimeSeconds += 1; return;
    }
    finishPhase(true);
  }

  function advanceDistraction() {
    distractionSeconds += 1;
    dangerStage = Math.min(3, 1 + Math.floor((distractionSeconds - 1) / growthEvery));

    if (dangerStage === 3) {
      finalFormSeconds += 1;
      const popupInterval = finalPopEvery === -1 ? growthEvery : finalPopEvery;
      if (popupInterval > 0 && finalFormSeconds % popupInterval === 0) void popFinalForm();
    } else {
      finalFormSeconds = 0;
    }

    if (dangerStage === 3 && minimizeAfter > 0 && finalFormSeconds >= minimizeAfter && !minimizedThisDistraction) {
      minimizedThisDistraction = true; void minimizeDistractingWindow();
    }
  }
  function clearDistraction() { distractionSeconds = 0; dangerStage = 0; finalFormSeconds = 0; minimizedThisDistraction = false; }

  function isTitleAllowed(title: string) {
    const normalized = title.trim().toLocaleLowerCase();
    if (!normalized || normalized.includes("nibbles")) return true;
    const matchesRule = rules.some((rule) => normalized.includes(rule.toLocaleLowerCase()));
    return watchMode === "whitelist" ? matchesRule : !matchesRule;
  }

  async function pollForegroundWindow() {
    try {
      const title = await invoke<string>("get_foreground_window_title");
      detectionSupported = true;
      const ownWindow = title.toLocaleLowerCase().includes("nibbles");
      if (ownWindow && monitorActive) return;
      if (ownWindow) { isAllowed = true; return; }
      activeTitle = title || "Untitled window";
      if (title) lastExternalTitle = title;
      const nextAllowed = isTitleAllowed(title);
      if (nextAllowed && !isAllowed) clearDistraction();
      if (!nextAllowed && isAllowed && monitorActive) { dangerStage = 1; distractionSeconds = 0; minimizedThisDistraction = false; }
      isAllowed = nextAllowed;
    } catch {
      detectionSupported = false; isAllowed = true; clearDistraction();
    }
  }

  async function minimizeDistractingWindow() {
    try { await invoke<boolean>("minimize_foreground_window", { expectedTitle: activeTitle }); }
    catch { /* The foreground window changed before the opt-in action. */ }
  }

  async function popFinalForm() {
    try {
      await appWindow.unminimize();
      await appWindow.show();
      await appWindow.center();
      await appWindow.setFocus();
    } catch { /* The desktop window may already be visible. */ }
  }

  async function resizeForState(stage: number, menuOpen: boolean) {
    try {
      const screenWidth = window.screen.availWidth || 1280;
      const screenHeight = window.screen.availHeight || 800;
      const sizes = menuOpen ? [[480, Math.min(640, screenHeight * .82)]] : [
        [360, 340], [430, 410],
        [Math.min(700, screenWidth * .48), Math.min(640, screenHeight * .66)],
        [Math.min(1180, screenWidth * .64), Math.min(960, screenHeight * .84)]
      ];
      const [width, height] = menuOpen ? sizes[0] : sizes[stage];
      await appWindow.setSize(new LogicalSize(Math.round(width), Math.round(height)));
      await appWindow.center();
    } catch { /* Browser preview has no native window. */ }
  }

  function addRule(value = ruleDraft) {
    const nextRule = value.trim(); if (!nextRule) return;
    if (!rules.some((rule) => rule.toLocaleLowerCase() === nextRule.toLocaleLowerCase())) rules = [...rules, nextRule];
    ruleDraft = ""; isAllowed = isTitleAllowed(activeTitle); persistSettings();
  }
  function removeRule(rule: string) { rules = rules.filter((item) => item !== rule); isAllowed = isTitleAllowed(activeTitle); persistSettings(); }
  function useObservedWindow() { if (lastExternalTitle) addRule(lastExternalTitle); }
  function setWatchMode(mode: WatchMode) { watchMode = mode; isAllowed = isTitleAllowed(activeTitle); clearDistraction(); persistSettings(); }

  function updateDuration(kind: Phase, value: number) {
    const safeValue = Math.max(1, Math.min(kind === "focus" ? 180 : 90, value || 1));
    if (kind === "focus") focusMinutes = safeValue; else breakMinutes = safeValue;
    if (!running && phase === kind) secondsLeft = safeValue * 60;
    persistSettings();
  }

  function persistSettings() {
    localStorage.setItem("nibbles-settings-v2", JSON.stringify({ watchMode, rules, growthEvery, minimizeAfter, finalPopEvery, focusMinutes, breakMinutes, overtimeEnabled, completedFocuses, sessionLogs }));
  }
  function restoreSettings() {
    try {
      const saved = localStorage.getItem("nibbles-settings-v2"); if (!saved) return;
      const data = JSON.parse(saved);
      if (data.watchMode === "whitelist" || data.watchMode === "blacklist") watchMode = data.watchMode;
      if (Array.isArray(data.rules)) rules = data.rules;
      if ([5, 10, 15, 30, 60].includes(data.growthEvery)) growthEvery = data.growthEvery;
      if ([0, 15, 30, 60, 120].includes(data.minimizeAfter)) minimizeAfter = data.minimizeAfter;
      if ([-1, 0, 15, 30, 60].includes(data.finalPopEvery)) finalPopEvery = data.finalPopEvery;
      if (Number.isFinite(data.focusMinutes)) focusMinutes = data.focusMinutes;
      if (Number.isFinite(data.breakMinutes)) breakMinutes = data.breakMinutes;
      if (typeof data.overtimeEnabled === "boolean") overtimeEnabled = data.overtimeEnabled;
      if (Number.isFinite(data.completedFocuses)) completedFocuses = data.completedFocuses;
      if (Array.isArray(data.sessionLogs)) sessionLogs = data.sessionLogs.slice(0, 100);
      secondsLeft = focusMinutes * 60;
    } catch { /* Keep safe defaults if local data is malformed. */ }
  }

  async function togglePinned() { try { pinned = !pinned; await appWindow.setAlwaysOnTop(pinned); } catch {} }
  function resetPreview() {
    if (previewTimeout) clearTimeout(previewTimeout);
    previewTimeout = null;
    previewStage = 0;
  }
  function toggleSettings() { settingsOpen = !settingsOpen; resetPreview(); }
  function previewForm(stage: number) {
    resetPreview();
    previewStage = stage;
    settingsOpen = false;
    if (stage > 0) previewTimeout = setTimeout(resetPreview, 3000);
  }
  function sessionDurationSeconds(log: SessionLog) {
    if (Number.isFinite(log.actualSeconds)) return Math.max(0, log.actualSeconds ?? 0);
    return log.completed ? Math.max(0, log.minutes * 60 + (log.overtimeSeconds || 0)) : 0;
  }
  function buildTrendDays(logs: SessionLog[]): TrendDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        key: date.getTime(),
        label: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(date),
        focusMinutes: 0,
        breakMinutes: 0
      } satisfies TrendDay;
    });
    for (const log of logs) {
      const date = new Date(log.endedAt);
      date.setHours(0, 0, 0, 0);
      const day = days.find((item) => item.key === date.getTime());
      if (day) day[log.phase === "focus" ? "focusMinutes" : "breakMinutes"] += sessionDurationSeconds(log) / 60;
    }
    return days;
  }
  function formatDuration(totalSeconds: number) {
    const roundedMinutes = Math.round(totalSeconds / 60);
    if (roundedMinutes < 60) return `${roundedMinutes}m`;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  function formatTrendMinutes(minutes: number) { return formatDuration(Math.round(minutes * 60)); }
  function formatLogTime(timestamp: number) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const sameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
    const day = sameDay(date, today) ? "Today" : sameDay(date, yesterday) ? "Yesterday" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
    const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
    return `${day} · ${time}`;
  }
  async function startDragging(event: PointerEvent) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, input, select, label")) return;
    event.preventDefault(); try { await appWindow.startDragging(); } catch {}
  }

  onMount(() => {
    restoreSettings(); appWindow.isAlwaysOnTop().then((value) => (pinned = value)).catch(() => {});
    timerInterval = setInterval(tick, 1000); monitorInterval = setInterval(pollForegroundWindow, 600); void pollForegroundWindow();
  });
  onDestroy(() => { if (timerInterval) clearInterval(timerInterval); if (monitorInterval) clearInterval(monitorInterval); if (previewTimeout) clearTimeout(previewTimeout); });
</script>

<svelte:head>
  <title>Nibbles · Productivity Familiar</title>
  <meta name="description" content="A summoned eldritch Pomodoro familiar that feasts on productivity." />
</svelte:head>

<main class:warning={dangerStage > 0} class:final-form={dangerStage === 3}>
  <section class="familiar" class:menu-open={settingsOpen} onpointerdown={startDragging} aria-label="Nibbles focus timer">
    <div class="ambient" aria-hidden="true"></div>

    <nav class="window-actions hover-reveal" aria-label="Window controls">
      <button class="icon-button" onclick={toggleSettings} aria-label="Open menu" aria-pressed={settingsOpen} title="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg></button>
      <button class="icon-button" class:active={pinned} onclick={togglePinned} aria-label={pinned ? "Unpin window" : "Pin window on top"} title={pinned ? "Unpin" : "Pin on top"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l-1 4 3 3v1H7v-1l3-3-1-4ZM12 12v7" /></svg></button>
      <button class="icon-button" onclick={() => appWindow.minimize()} aria-label="Minimize Nibbles" title="Minimize"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15h12" /></svg></button>
      <button class="icon-button danger-button" onclick={() => appWindow.close()} aria-label="Close Nibbles" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg></button>
    </nav>

    {#if settingsOpen}
      <div class="settings-panel">
        <header class="settings-header">
          <div class="menu-title"><p class="kicker">NIBBLES</p><h1>{menuView === "settings" ? "Ritual settings" : "Focus activity"}</h1></div>
          <div class="settings-tools">
            <div class="menu-tabs" role="tablist" aria-label="Menu sections">
              <button role="tab" class:active={menuView === "settings"} onclick={() => (menuView = "settings")} aria-label="Settings" aria-selected={menuView === "settings"} aria-controls="settings-view" title="Settings"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.6l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.8 2h-3l-.7 2.4a7 7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.6l-2 .7v3l2 .7a7 7 0 0 0 .7 1.6l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.7.7l.7 2.4h3l.7-2.4a7 7 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .7-1.6Z" transform="translate(2.2 0) scale(.82)"/></svg></button>
              <button role="tab" class:active={menuView === "activity"} onclick={() => (menuView = "activity")} aria-label="Focus activity" aria-selected={menuView === "activity"} aria-controls="activity-view" title="Focus activity"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V11M12 19V5M19 19v-7"/><path d="M3 19h18"/></svg></button>
            </div>
            <button class="icon-button visible" onclick={toggleSettings} aria-label="Close menu" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg></button>
          </div>
        </header>

        {#if menuView === "settings"}
          <div class="menu-view settings-view" id="settings-view" role="tabpanel" aria-label="Settings">
            <section class="setting-section first-section">
              <div class="section-heading"><h2>Window rules</h2><span class:status-live={detectionSupported}><i></i>{detectionSupported ? "watching" : "desktop only"}</span></div>
              <div class="mode-switch" role="group" aria-label="Window rule mode">
                <button class:chosen={watchMode === "whitelist"} onclick={() => setWatchMode("whitelist")}>Whitelist</button>
                <button class:chosen={watchMode === "blacklist"} onclick={() => setWatchMode("blacklist")}>Blacklist</button>
              </div>
              <p class="help-copy">{watchMode === "whitelist" ? "Nibbles stays calm only in matching windows." : "Nibbles reacts whenever a matching window is open."}</p>
              <div class="rule-entry">
                <input bind:value={ruleDraft} onkeydown={(event) => event.key === "Enter" && addRule()} placeholder="App or tab-title phrase" aria-label="Window title phrase" />
                <button onclick={() => addRule()} aria-label="Add rule" title="Add rule"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></button>
              </div>
              <div class="chips" aria-label="Window title rules">
                {#each rules as rule}<button class="chip" onclick={() => removeRule(rule)} title="Remove rule">{rule}<span>×</span></button>{/each}
              </div>
              {#if lastExternalTitle}
                <button class="observed-title" onclick={useObservedWindow} title="Add this exact title"><span><small>LAST WINDOW</small>{lastExternalTitle}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg></button>
              {/if}
            </section>

            <section class="setting-section">
              <div class="section-heading"><h2>Timer</h2><span>minutes</span></div>
              <div class="settings-grid timer-grid">
                <label><span>Focus</span><input type="number" min="1" max="180" value={focusMinutes} onchange={(event) => updateDuration("focus", Number(event.currentTarget.value))} /><small>min</small></label>
                <label><span>Break</span><input type="number" min="1" max="90" value={breakMinutes} onchange={(event) => updateDuration("break", Number(event.currentTarget.value))} /><small>min</small></label>
              </div>
              <label class="toggle-row"><span><b>Flow overtime</b><small>Keep counting when focus ends.</small></span><input type="checkbox" bind:checked={overtimeEnabled} onchange={persistSettings} /></label>
            </section>

            <section class="setting-section">
              <div class="section-heading"><h2>Distraction response</h2><span>forms 2–4</span></div>
              <div class="settings-grid response-grid">
                <label><span>Grow every</span><select bind:value={growthEvery} onchange={persistSettings}><option value={5}>5 sec</option><option value={10}>10 sec</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>60 sec</option></select></label>
                <label><span>Minimize after final</span><select bind:value={minimizeAfter} onchange={persistSettings}><option value={0}>Never</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>1 min</option><option value={120}>2 min</option></select></label>
                <label><span>Final pop-up</span><select bind:value={finalPopEvery} onchange={persistSettings}><option value={-1}>With growth</option><option value={0}>Never</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>1 min</option></select></label>
              </div>
            </section>

            <div class="form-preview" aria-label="Preview warning forms"><span>Preview forms</span>{#each [0, 1, 2, 3] as stage}<button onclick={() => previewForm(stage)} aria-label={`Preview form ${stage + 1}`}>{stage + 1}</button>{/each}</div>
          </div>
        {:else}
          <div class="menu-view stats-section activity-view" id="activity-view" role="tabpanel" aria-label="Focus activity">
            <div class="section-heading activity-heading">
              <div><p class="section-kicker">LAST 7 DAYS</p><h2>Your week</h2></div>
            <span class:trend-up={trendChange > 0} class:trend-down={trendChange < 0} class="trend-change" title="Recent three days compared with the prior three days">
              {#if trendChange > 0}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 11 4-4 2.5 2.5L13 6"/><path d="M9.5 6H13v3.5"/></svg>{:else if trendChange < 0}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 5 4 4 2.5-2.5L13 10"/><path d="M9.5 10H13V6.5"/></svg>{:else}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>{/if}
              {Math.abs(trendChange)}%
            </span>
          </div>

          <div class="activity-summary" aria-label="Seven-day totals">
            <div><span>Focus</span><strong>{formatTrendMinutes(weekFocusMinutes)}</strong></div>
            <div><span>Break</span><strong>{formatTrendMinutes(weekBreakMinutes)}</strong></div>
            <div><span>Fed</span><strong>{weekCompletedFocuses}</strong></div>
          </div>

          <div class="trend-chart" role="img" aria-label={`Seven-day chart: ${formatTrendMinutes(weekFocusMinutes)} focused and ${formatTrendMinutes(weekBreakMinutes)} on breaks`}>
            {#each trendDays as day}
              <div class="trend-day">
                <div class="bar-pair">
                  <span class="focus-bar" title={`${formatTrendMinutes(day.focusMinutes)} focus`} style:height={`${day.focusMinutes > 0 ? Math.max(4, day.focusMinutes / trendMaximum * 100) : 0}%`}></span>
                  <span class="break-bar" title={`${formatTrendMinutes(day.breakMinutes)} break`} style:height={`${day.breakMinutes > 0 ? Math.max(4, day.breakMinutes / trendMaximum * 100) : 0}%`}></span>
                </div>
                <small>{day.label}</small>
              </div>
            {/each}
          </div>
          <div class="trend-legend" aria-hidden="true"><span><i class="focus-key"></i>Focus</span><span><i class="break-key"></i>Break</span></div>

          <div class="session-heading">
            <h3>Sessions</h3>
            <div class="log-filters" role="group" aria-label="Filter sessions">
              <button class:active={logFilter === "all"} onclick={() => (logFilter = "all")} aria-label="Show all sessions" aria-pressed={logFilter === "all"} title="All sessions"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 5h9M6.5 10h9M6.5 15h9"/><circle cx="3.5" cy="5" r=".8"/><circle cx="3.5" cy="10" r=".8"/><circle cx="3.5" cy="15" r=".8"/></svg></button>
              <button class:active={logFilter === "focus"} onclick={() => (logFilter = "focus")} aria-label="Show focus sessions" aria-pressed={logFilter === "focus"} title="Focus sessions"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="2.5"/><path d="M10 1.5V4M18.5 10H16"/></svg></button>
              <button class:active={logFilter === "break"} onclick={() => (logFilter = "break")} aria-label="Show break sessions" aria-pressed={logFilter === "break"} title="Break sessions"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14.8 13.6A6.7 6.7 0 0 1 6.4 5.2 6.7 6.7 0 1 0 14.8 13.6Z"/></svg></button>
            </div>
          </div>

          {#if filteredLogs.length === 0}
            <div class="empty-log"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v7l4 2M21 12a9 9 0 1 1-3-6.7"/></svg><p>{sessionLogs.length === 0 ? "Complete or skip a ritual and it will appear here." : "No sessions match this filter yet."}</p></div>
          {:else}
            <ol class="log-list">
              {#each filteredLogs as log}
                <li>
                  <span class:focus={log.phase === "focus"} class:break={log.phase === "break"} class="log-icon" aria-hidden="true">
                    {#if log.phase === "focus"}<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5.5"/><circle cx="10" cy="10" r="2"/></svg>{:else}<svg viewBox="0 0 20 20"><path d="M14.8 13.6A6.7 6.7 0 0 1 6.4 5.2 6.7 6.7 0 1 0 14.8 13.6Z"/></svg>{/if}
                  </span>
                  <span class="log-copy"><strong>{log.phase === "focus" ? "Focus" : "Break"}</strong><small>{log.completed ? "Completed" : "Skipped"}{log.overtimeSeconds > 0 ? ` · +${Math.ceil(log.overtimeSeconds / 60)}m flow` : ""} · {formatLogTime(log.endedAt)}</small></span>
                  <time datetime={new Date(log.endedAt).toISOString()}>{formatDuration(sessionDurationSeconds(log))}</time>
                </li>
              {/each}
            </ol>
          {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div class="creature-stage stage-{effectiveStage}" aria-hidden="true">
        {#key effectiveStage}<div class="form-change"><div class="float-layer"><img class="creature" src={creatureSource} alt="" />{#if showBook}<img class="book" src="/form1_book.png" alt="" />{/if}</div></div>{/key}
        {#if effectiveStage >= 2}<div class="monster-speech" data-text="FEED ME">FEED ME</div>{/if}
      </div>

      <div class="time-indicator" class:paused={monitorActive && !isAllowed} class:overtime={isOvertime && isAllowed}>
        <svg class="progress-ring" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="progress-track" cx="12" cy="12" r="9" pathLength="100" />
          <circle class="progress-value" cx="12" cy="12" r="9" pathLength="100" style={`stroke-dashoffset: ${100 - timerProgress * 100}`} />
        </svg>
        <time aria-label={displayTime}>{displayTime}</time><span>{indicatorLabel}</span>
      </div>

      <div class="timer-actions hover-reveal" role="group" aria-label="Timer controls">
        <button class="icon-button" onclick={toggleTimer} aria-label={running ? "Pause timer" : "Start timer"} title={running ? "Pause" : "Start"}>
          {#if running}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10M15 7v10" /></svg>{:else}<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z" /></svg>{/if}
        </button>
        <button class="icon-button" onclick={stopTimer} aria-label="Stop and reset timer" title="Stop"><svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="8" height="8" rx="1.5" /></svg></button>
        <button class="icon-button" onclick={skipPhase} aria-label={phase === "focus" ? "Skip to break" : "Skip to focus"} title={phase === "focus" ? "Skip to break" : "Skip to focus"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 6 6-6 6M13 6l6 6-6 6" /></svg></button>
      </div>

      {#if monitorActive && !isAllowed}<div class="warning-caption"><strong>{distractionLabel}</strong><span>{distractionSeconds}s · {activeTitle}</span></div>{/if}
    {/if}
  </section>
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html), :global(body) { width: 100%; min-width: 100%; min-height: 100%; margin: 0; overflow: hidden; background: transparent !important; color: #f7e8e3; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  :global(button), :global(input), :global(select) { font: inherit; }
  :global(button) { color: inherit; }
  main { width: 100vw; height: 100vh; background: transparent; }
  .familiar { position: relative; width: 100%; height: 100%; overflow: hidden; isolation: isolate; }
  .ambient { position: absolute; z-index: -1; inset: 3%; pointer-events: none; background: radial-gradient(ellipse at 50% 56%, rgba(54,7,20,.58), rgba(44,8,24,.32) 34%, rgba(22,6,18,.12) 55%, transparent 73%); filter: blur(5px); transition: 400ms ease; }
  .warning .ambient { inset: 0; background: radial-gradient(ellipse at 50% 54%, rgba(176,22,48,.68), rgba(83,8,28,.28) 48%, transparent 73%); }
  .final-form .ambient { background: radial-gradient(ellipse at 50% 50%, rgba(206,25,52,.76), rgba(91,7,29,.32) 55%, transparent 76%); }

  .hover-reveal { opacity: 0; pointer-events: none; transform: translateY(-5px); transition: opacity 150ms ease, transform 150ms ease; }
  .familiar:hover .hover-reveal, .familiar:focus-within .hover-reveal { opacity: 1; pointer-events: auto; transform: none; }
  .window-actions { position: absolute; z-index: 20; top: 10px; right: 10px; display: flex; gap: 4px; }
  .menu-open > .window-actions { display: none; }
  button { border: 0; cursor: pointer; }
  .icon-button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; border: 1px solid rgba(255,235,231,.1); border-radius: 50%; background: linear-gradient(145deg, rgba(46,17,31,.8), rgba(16,7,16,.72)); color: rgba(247,224,220,.72); font-size: .74rem; line-height: 1; box-shadow: 0 5px 14px rgba(0,0,0,.23); backdrop-filter: blur(8px); transition: 130ms ease; }
  .icon-button svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .icon-button svg.filled-icon { fill: currentColor; stroke: none; }
  .icon-button:hover, .icon-button:focus-visible, .icon-button.active { border-color: rgba(230,146,153,.34); color: #fff4ef; background: linear-gradient(145deg, rgba(111,30,50,.9), rgba(41,10,27,.84)); transform: translateY(-1px); }
  .danger-button:hover { background: #741d34; }
  .visible { opacity: 1; pointer-events: auto; }

  .creature-stage { position: absolute; inset: 0 0 52px; display: grid; place-items: center; pointer-events: none; }
  .form-change { display: grid; width: 100%; height: 100%; place-items: center; transform-origin: 50% 50%; animation: form-change .58s cubic-bezier(.36,.07,.19,.97) both; }
  .float-layer { position: relative; display: grid; width: 100%; height: 100%; place-items: center; transform-origin: 50% 50%; animation: float 3.8s ease-in-out infinite; }
  .creature { display: block; max-width: 94%; max-height: 94%; object-fit: contain; transform-origin: 50% 50%; filter: brightness(1.28) saturate(1.65) contrast(1.06) drop-shadow(1px 0 0 rgba(236,75,91,.72)) drop-shadow(-1px 0 0 rgba(236,75,91,.58)) drop-shadow(0 1px 0 rgba(236,75,91,.62)) drop-shadow(0 -1px 0 rgba(236,75,91,.5)) drop-shadow(0 0 11px rgba(213,36,65,.48)) drop-shadow(0 14px 18px rgba(9,0,8,.48)); transition: width 450ms ease; }
  .stage-0 .creature { width: min(62vw, 210px); }
  .stage-1 .creature { width: min(88vw, 380px); }
  .stage-2 .creature { width: min(91vw, 650px); }
  .stage-3 { inset: 28px 34px 62px; }
  .stage-3 .creature { width: min(90vw, 1080px); max-width: 90%; max-height: 88%; }
  .book { position: absolute; z-index: 3; left: 41%; bottom: 17%; width: min(34vw, 118px); transform: translateX(-50%) rotate(-2deg); filter: drop-shadow(0 12px 14px rgba(0,0,0,.42)); animation: book-float 2.7s ease-in-out infinite; }

  .monster-speech { position: absolute; z-index: 8; top: 9%; left: 10%; color: #e2a1a5; font-family: "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive; font-size: clamp(1.25rem, 4.5vw, 3.6rem); font-weight: 900; letter-spacing: .09em; line-height: .9; white-space: nowrap; rotate: -8deg; text-shadow: 2px 2px 0 #561123, -1px 1px 0 #270711, 0 0 14px rgba(163,32,55,.7); animation: speech-twitch 1.8s steps(2) infinite; }
  .monster-speech::after { content: attr(data-text); position: absolute; inset: 2px 0 0 3px; color: transparent; white-space: nowrap; -webkit-text-stroke: 1px rgba(117,24,40,.65); opacity: .75; transform: skewX(-7deg); }
  .stage-3 .monster-speech { top: 7%; left: 8%; color: #f0b0b0; font-size: clamp(2rem, 6vw, 5.4rem); rotate: -11deg; }

  .time-indicator { position: absolute; z-index: 12; left: 50%; bottom: 17px; display: flex; align-items: baseline; gap: 7px; min-width: 118px; padding: 7px 11px; border: 1px solid rgba(255,232,226,.09); border-radius: 999px; background: linear-gradient(110deg, rgba(19,7,17,.82), rgba(88,22,42,.48)); box-shadow: 0 8px 24px rgba(0,0,0,.28); backdrop-filter: blur(9px); transform: translateX(-50%); }
  .progress-ring { width: 18px; height: 18px; overflow: visible; rotate: -90deg; }
  .progress-ring circle { fill: none; stroke-width: 2.5; }
  .progress-track { stroke: rgba(255,235,229,.14); }
  .progress-value { stroke: #86b58f; stroke-dasharray: 100; stroke-dashoffset: 100; stroke-linecap: round; filter: drop-shadow(0 0 2px rgba(114,185,133,.65)); transition: stroke-dashoffset .45s linear, stroke .2s ease; }
  .time-indicator time { color: #fff0e9; font-family: Georgia, "Times New Roman", serif; font-size: 1.05rem; font-variant-numeric: tabular-nums; line-height: 1; }
  .time-indicator span { color: #b29495; font-size: .47rem; font-weight: 850; letter-spacing: .14em; }
  .time-indicator.paused .progress-value { stroke: #e24c62; filter: drop-shadow(0 0 3px #d73754); animation: blink .7s steps(2) infinite; }
  .time-indicator.paused span { color: #efa1aa; }
  .time-indicator.overtime { background: linear-gradient(110deg, rgba(19,7,17,.84), rgba(85,55,24,.54)); }
  .timer-actions { position: absolute; z-index: 16; left: 50%; bottom: 58px; display: flex; gap: 5px; transform: translate(-50%,5px); }
  .familiar:hover .timer-actions, .familiar:focus-within .timer-actions { transform: translateX(-50%); }
  .timer-actions .icon-button { width: 30px; height: 30px; }

  .warning-caption { position: absolute; z-index: 13; left: 50%; top: 9%; max-width: min(82vw,520px); color: #ffd9d6; text-align: center; text-shadow: 0 2px 12px rgba(65,0,14,.9); transform: translateX(-50%); animation: caption-in .25s ease both; }
  .warning-caption strong, .warning-caption span { display: block; }
  .warning-caption strong { font-size: .58rem; letter-spacing: .16em; }
  .warning-caption span { overflow: hidden; margin-top: 4px; color: rgba(239,183,184,.72); font-size: .56rem; text-overflow: ellipsis; white-space: nowrap; }

  .settings-panel { position: absolute; z-index: 10; inset: 12px; display: flex; overflow: hidden; padding: 20px; flex-direction: column; border: 1px solid rgba(255,235,230,.1); border-radius: 38px 25px 40px 27px / 30px 41px 27px 39px; background: radial-gradient(circle at 18% 3%, rgba(103,31,50,.34), transparent 31%), linear-gradient(150deg, rgba(25,10,23,.97), rgba(9,5,12,.95)); box-shadow: 0 22px 55px rgba(0,0,0,.52), inset 0 1px rgba(255,255,255,.04); backdrop-filter: blur(14px); }
  .settings-header, .section-heading, .toggle-row, .observed-title, .form-preview { display: flex; align-items: center; }
  .settings-header { flex: 0 0 auto; justify-content: space-between; gap: 12px; margin-bottom: 8px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.055); }
  .menu-title { min-width: 0; }
  .kicker { margin: 0 0 2px; color: #a77b85; font-size: .53rem; font-weight: 850; letter-spacing: .19em; }
  h1, h2 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 600; }
  h1 { overflow: hidden; font-size: 1.32rem; text-overflow: ellipsis; white-space: nowrap; } h2 { font-size: .9rem; }
  .settings-tools, .menu-tabs { display: flex; align-items: center; }
  .settings-tools { flex: 0 0 auto; gap: 7px; }
  .menu-tabs { gap: 3px; padding: 3px; border: 1px solid rgba(255,255,255,.055); border-radius: 999px; background: rgba(0,0,0,.22); }
  .menu-tabs button { display: grid; width: 27px; height: 27px; padding: 0; place-items: center; border: 1px solid transparent; border-radius: 50%; background: transparent; color: #765f68; transition: 130ms ease; }
  .menu-tabs button:hover, .menu-tabs button:focus-visible { color: #e8ced0; }
  .menu-tabs button.active { border-color: rgba(244,111,130,.2); background: linear-gradient(145deg, rgba(130,34,58,.8), rgba(55,13,34,.83)); color: #fff0ec; box-shadow: 0 3px 10px rgba(38,4,20,.3); }
  .menu-tabs svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.55; stroke-linecap: round; stroke-linejoin: round; }
  .menu-view { min-height: 0; flex: 1 1 auto; padding-right: 3px; overflow: auto; scrollbar-width: thin; scrollbar-color: #633048 transparent; }
  .setting-section { padding: 13px 0; border-top: 1px solid rgba(255,255,255,.06); }
  .setting-section.first-section { padding-top: 9px; border-top: 0; }
  .section-heading { justify-content: space-between; }
  .section-heading > span { color: #986f79; font-size: .55rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
  .section-heading > span i { display: inline-block; width: 5px; height: 5px; margin-right: 5px; border-radius: 50%; background: #6c5860; }
  .section-heading > span.status-live i { background: #82b38d; box-shadow: 0 0 7px rgba(130,179,141,.55); }
  .mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin: 10px 0 7px; padding: 3px; border-radius: 999px; background: rgba(0,0,0,.27); }
  .mode-switch button { padding: 7px; border-radius: 999px; background: transparent; color: #8f777c; font-size: .65rem; }
  .mode-switch button.chosen { background: linear-gradient(120deg,#7f2941,#4e182f); color: #fff0e9; box-shadow: 0 3px 12px rgba(57,5,24,.35); }
  .help-copy { margin: 5px 0 9px; color: #927b80; font-size: .66rem; line-height: 1.42; }
  .rule-entry { display: grid; grid-template-columns: 1fr 34px; gap: 6px; }
  input, select { min-width: 0; border: 1px solid rgba(255,255,255,.08); outline: 0; background: rgba(0,0,0,.25); color: #f1dcda; }
  input:focus, select:focus { border-color: rgba(207,79,102,.55); box-shadow: 0 0 0 3px rgba(159,37,64,.13); }
  .rule-entry input { width: 100%; padding: 9px 11px; border-radius: 11px; font-size: .7rem; }
  .rule-entry > button { display: grid; padding: 0; place-items: center; border-radius: 11px; background: linear-gradient(145deg, #8d2c49, #5e1937); color: #ffeae7; }
  .rule-entry > button svg, .observed-title > svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
  .chip { padding: 5px 8px; border: 1px solid rgba(255,255,255,.07); border-radius: 999px; background: rgba(255,255,255,.05); color: #cdb6b4; font-size: .59rem; }
  .chip span { margin-left: 5px; color: #91616f; }
  .observed-title { width: 100%; justify-content: space-between; gap: 10px; margin-top: 9px; padding: 7px 9px; border-radius: 10px; background: rgba(106,30,51,.15); text-align: left; }
  .observed-title span { min-width: 0; overflow: hidden; font-size: .58rem; text-overflow: ellipsis; white-space: nowrap; }
  .observed-title small { display: block; margin-bottom: 1px; color: #87636d; font-size: .45rem; font-weight: 800; letter-spacing: .12em; }
  .observed-title > svg { flex: 0 0 auto; color: #d58b99; }
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 9px; }
  .settings-grid label { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 4px; padding: 8px 9px; border: 1px solid rgba(255,255,255,.055); border-radius: 11px; color: #a78e90; font-size: .61rem; }
  .response-grid { grid-template-columns: 1fr 1fr; }
  .response-grid label:last-child { grid-column: 1 / -1; }
  .settings-grid input { width: 39px; padding: 4px; border-radius: 6px; text-align: right; }
  .settings-grid select { max-width: 74px; padding: 4px; border-radius: 6px; font-size: .58rem; }
  .settings-grid small { color: #705e64; }
  .toggle-row { justify-content: space-between; gap: 15px; margin-top: 8px; padding: 9px 2px 0; border-top: 1px solid rgba(255,255,255,.05); }
  .toggle-row span, .toggle-row b, .toggle-row small { display: block; }
  .toggle-row b { font-family: Georgia, "Times New Roman", serif; font-size: .82rem; }
  .toggle-row small { margin-top: 2px; color: #8d777c; font-size: .58rem; }
  .toggle-row input { width: 31px; height: 17px; accent-color: #932f4a; }
  .stats-section { padding: 10px 3px 6px 0; }
  .activity-view .trend-chart { height: 124px; }
  .activity-view .log-list { max-height: 300px; }
  .stats-section .activity-heading { align-items: flex-end; margin-bottom: 11px; }
  .section-kicker { margin: 0 0 2px; color: #7f626a; font-size: .46rem; font-weight: 850; letter-spacing: .16em; }
  .trend-change { display: inline-flex; align-items: center; gap: 3px; padding: 4px 7px; border: 1px solid rgba(255,255,255,.06); border-radius: 999px; background: rgba(255,255,255,.035); color: #8f7d81; font-size: .52rem; font-weight: 800; }
  .trend-change svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
  .trend-change.trend-up { border-color: rgba(127,178,139,.14); background: rgba(81,135,96,.1); color: #8dc39a; }
  .trend-change.trend-down { border-color: rgba(229,87,111,.15); background: rgba(155,38,61,.11); color: #f06a7e; }
  .activity-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 9px; }
  .activity-summary div { padding: 8px 9px 7px; border: 1px solid rgba(255,255,255,.055); border-radius: 11px; background: linear-gradient(145deg, rgba(255,255,255,.035), rgba(0,0,0,.07)); }
  .activity-summary span, .activity-summary strong { display: block; }
  .activity-summary span { margin-bottom: 2px; color: #7f6c71; font-size: .48rem; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; }
  .activity-summary strong { overflow: hidden; color: #ead6d3; font-family: Georgia, "Times New Roman", serif; font-size: .81rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .trend-chart { display: grid; grid-template-columns: repeat(7, 1fr); height: 100px; padding: 9px 8px 3px; border: 1px solid rgba(255,255,255,.05); border-radius: 13px; background: repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(255,255,255,.035) 28px), rgba(0,0,0,.13); }
  .trend-day { display: grid; grid-template-rows: 1fr 13px; min-width: 0; text-align: center; }
  .bar-pair { display: flex; align-items: flex-end; justify-content: center; gap: 3px; min-height: 0; }
  .bar-pair > span { display: block; width: 7px; min-height: 0; border-radius: 5px 5px 2px 2px; transition: height 240ms ease; }
  .focus-bar { background: linear-gradient(to top, #8e2444, #ff6077); box-shadow: 0 0 9px rgba(240,66,94,.2); }
  .break-bar { background: linear-gradient(to top, #526d65, #91b8a7); opacity: .8; }
  .trend-day small { align-self: end; color: #705f64; font-size: .48rem; font-weight: 700; }
  .trend-legend { display: flex; justify-content: flex-end; gap: 10px; margin: 5px 2px 12px; color: #756268; font-size: .48rem; }
  .trend-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .trend-legend i { width: 5px; height: 5px; border-radius: 50%; }
  .trend-legend .focus-key { background: #ed4e68; box-shadow: 0 0 5px rgba(237,78,104,.35); }
  .trend-legend .break-key { background: #87ad9e; }
  .session-heading { display: flex; align-items: center; justify-content: space-between; margin: 0 0 7px; }
  .session-heading h3 { margin: 0; color: #cdb5b3; font-family: Georgia, "Times New Roman", serif; font-size: .76rem; font-weight: 600; }
  .log-filters { display: flex; gap: 4px; padding: 3px; border-radius: 999px; background: rgba(0,0,0,.2); }
  .log-filters button { display: grid; width: 25px; height: 25px; padding: 0; place-items: center; border: 1px solid transparent; border-radius: 50%; background: transparent; color: #77636a; transition: 130ms ease; }
  .log-filters button:hover, .log-filters button:focus-visible { color: #e4c9c8; }
  .log-filters button.active { border-color: rgba(245,111,129,.22); background: linear-gradient(145deg, rgba(137,37,61,.75), rgba(61,15,38,.78)); color: #fff0eb; box-shadow: 0 3px 10px rgba(42,6,22,.28); }
  .log-filters svg, .empty-log svg, .log-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; }
  .empty-log { display: flex; min-height: 58px; align-items: center; justify-content: center; gap: 9px; padding: 9px 12px; border: 1px dashed rgba(255,255,255,.065); border-radius: 11px; color: #705e64; }
  .empty-log svg { flex: 0 0 auto; width: 19px; height: 19px; }
  .empty-log p { max-width: 210px; margin: 0; font-size: .57rem; line-height: 1.4; }
  .log-list { display: grid; max-height: 252px; gap: 5px; margin: 0; padding: 0 3px 0 0; overflow: auto; list-style: none; scrollbar-width: thin; scrollbar-color: #5f2940 transparent; }
  .log-list li { display: grid; grid-template-columns: 31px minmax(0,1fr) auto; align-items: center; gap: 8px; min-height: 43px; padding: 5px 8px 5px 5px; border: 1px solid rgba(255,255,255,.045); border-radius: 11px; background: rgba(255,255,255,.022); }
  .log-icon { display: grid; width: 29px; height: 29px; place-items: center; border-radius: 9px; }
  .log-icon.focus { background: rgba(168,38,65,.15); color: #f45d75; }
  .log-icon.break { background: rgba(95,137,123,.14); color: #91bbaa; }
  .log-copy { min-width: 0; }
  .log-copy strong, .log-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .log-copy strong { color: #cbb3b2; font-size: .6rem; font-weight: 700; }
  .log-copy small { margin-top: 2px; color: #725f65; font-size: .48rem; }
  .log-list time { color: #a98c91; font-size: .55rem; font-variant-numeric: tabular-nums; }
  .form-preview { justify-content: flex-end; gap: 5px; color: #776168; font-size: .55rem; }
  .form-preview span { margin-right: auto; }
  .form-preview button { display: grid; width: 23px; height: 23px; padding: 0; place-items: center; border-radius: 50%; background: rgba(255,255,255,.06); color: #b28c94; font-size: .55rem; }

  @keyframes float { 0%,100% { transform: translateY(5px) rotate(-.7deg); } 50% { transform: translateY(-7px) rotate(.7deg); } }
  @keyframes book-float { 0%,100% { transform: translate(-50%,2px) rotate(-2deg); } 50% { transform: translate(-50%,-7px) rotate(1deg); } }
  @keyframes form-change { 0% { opacity: .25; transform: translate(0) scale(.9); } 12% { transform: translate(-9px,4px) scale(1.02); } 25% { transform: translate(8px,-5px); } 38% { transform: translate(-7px,-2px); } 52% { transform: translate(6px,4px); } 67% { transform: translate(-4px,1px); } 82% { transform: translate(3px,-2px); } 100% { opacity: 1; transform: translate(0) scale(1); } }
  @keyframes caption-in { from { opacity: 0; transform: translate(-50%,-4px); } }
  @keyframes speech-twitch { 0%,100% { transform: translate(0) skewX(-3deg); } 45% { transform: translate(2px,-1px) skewX(2deg); } 55% { transform: translate(-1px,1px) skewX(-5deg); } }
  @keyframes blink { 50% { opacity: .25; } }
  @media (max-width: 430px), (max-height: 390px) { .window-actions { top: 7px; right: 7px; } .book { bottom: 9%; width: min(40vw,138px); } .time-indicator { bottom: 12px; } .timer-actions { bottom: 52px; } }
</style>
