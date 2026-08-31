<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';

  const appWindow = getCurrentWindow();

  /** Visual inputs are derived by DistractionStore; this component owns animation only. */
  type Props = {
    stage: number;
    source: string;
    showBook: boolean;
  };
  let { stage, source, showBook }: Props = $props();

  let imgElement = $state<HTMLImageElement | null>(null);

    /** Make window draggable */
  function handleDrag(e: MouseEvent) {
    if (e.buttons !== 1 || !imgElement) return;

    // Create a temporary, invisible canvas
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw the current frame of the creature onto our canvas
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    
    if (e.buttons === 1) { //Left click
      void appWindow.startDragging();
    }
  }
</script>

<div class="creature-stage stage-{stage}" onmousedown={handleDrag} aria-hidden="true">
  <!-- Re-keying the form intentionally restarts the transformation animation. -->
  {#key stage}
    <div class="form-change">
      <div class="float-layer">
        <img class="creature" src={source} alt="" />
        {#if showBook}<img class="book" src="/form1_book.png" alt="" />{/if}
      </div>
    </div>
  {/key}
  <!-- Later forms add a deliberately rough, duplicated-text warning treatment. -->
  {#if stage >= 2}<div class="monster-speech" data-text="FEED ME">FEED ME</div>{/if} <!-- TODO REMOVE? MAKE IT LOOK BETTER -->
</div>

<style>
  /* Form sizing scales with the progressively enlarged native window. */
  .creature-stage { position: absolute; inset: 0 0 42px; display: grid; place-items: center;}
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

  @keyframes float { 0%,100% { transform: translateY(5px) rotate(-.7deg); } 50% { transform: translateY(-7px) rotate(.7deg); } }
  @keyframes book-float { 0%,100% { transform: translate(-50%,2px) rotate(-2deg); } 50% { transform: translate(-50%,-7px) rotate(1deg); } }
  @keyframes form-change { 0% { opacity: .25; transform: translate(0) scale(.9); } 12% { transform: translate(-9px,4px) scale(1.02); } 25% { transform: translate(8px,-5px); } 38% { transform: translate(-7px,-2px); } 52% { transform: translate(6px,4px); } 67% { transform: translate(-4px,1px); } 82% { transform: translate(3px,-2px); } 100% { opacity: 1; transform: translate(0) scale(1); } }
  @keyframes speech-twitch { 0%,100% { transform: translate(0) skewX(-3deg); } 45% { transform: translate(2px,-1px) skewX(2deg); } 55% { transform: translate(-1px,1px) skewX(-5deg); } }
  @media (max-width: 430px), (max-height: 390px) { .book { bottom: 9%; width: min(40vw,138px); } }
</style>
