<script lang="ts">
  type Props = {
    stage: number;
    source: string;
    showBook: boolean;
  };

  let { stage, source, showBook }: Props = $props();
</script>

<div class="creature-companion stage-{stage}" aria-hidden="true">
  <!-- Re-keying intentionally restarts the transformation animation. -->
  {#key stage}
    <div class="form-change">
      <div class="float-layer">
        <img class="creature" src={source} alt="" />

        {#if showBook}
          <img class="book" src="/form1_book.png" alt="" />
        {/if}
      </div>
    </div>
  {/key}

  {#if stage >= 2}
    <div class="monster-speech" data-text="FEED ME">FEED ME</div>
  {/if}
</div>


<style>
  .creature-companion,
  .form-change,
  .float-layer {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
  }

  .creature-companion {
    position: relative;
  }

  .form-change {
    transform-origin: center;
    animation: form-change 580ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  .float-layer {
    position: relative;
    transform-origin: center;
    animation: float 3.8s ease-in-out infinite;
  }

  .creature {
    display: block;
    max-width: 94%;
    max-height: 94%;
    object-fit: contain;
    transform-origin: center;
    filter:
      brightness(1.28)
      saturate(1.65)
      contrast(1.06)
      drop-shadow(1px 0 0 rgba(236, 75, 91, 0.72))
      drop-shadow(-1px 0 0 rgba(236, 75, 91, 0.58))
      drop-shadow(0 1px 0 rgba(236, 75, 91, 0.62))
      drop-shadow(0 -1px 0 rgba(236, 75, 91, 0.5))
      drop-shadow(0 0 0.7rem rgba(213, 36, 65, 0.48))
      drop-shadow(0 0.875rem 1.125rem rgba(9, 0, 8, 0.48));
    transition: width 450ms ease;
  }

  .stage-0 .creature {
    width: min(62vw, 13.125rem);
  }

  .stage-1 .creature {
    width: min(88vw, 23.75rem);
  }

  .stage-2 .creature {
    width: min(91vw, 40.625rem);
  }

  .stage-3 .creature {
    width: min(90vw, 67.5rem);
    max-width: 90%;
    max-height: 88%;
  }

  .book {
    position: absolute;
    z-index: 3;
    left: 41%;
    bottom: 17%;
    width: min(34vw, 7.375rem);
    transform: translateX(-50%) rotate(-2deg);
    filter: drop-shadow(0 0.75rem 0.875rem rgba(0, 0, 0, 0.42));
    animation: book-float 2.7s ease-in-out infinite;
  }

  .monster-speech {
    position: absolute;
    z-index: 8;
    top: 9%;
    left: 10%;
    color: #e2a1a5;
    font-family: "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
    font-size: clamp(1.25rem, 4.5vw, 3.6rem);
    font-weight: 900;
    letter-spacing: 0.09em;
    line-height: 0.9;
    white-space: nowrap;
    rotate: -8deg;
    text-shadow:
      2px 2px 0 #561123,
      -1px 1px 0 #270711,
      0 0 0.875rem rgba(163, 32, 55, 0.7);
    animation: speech-twitch 1.8s steps(2) infinite;
  }

  .monster-speech::after {
    content: attr(data-text);
    position: absolute;
    inset: 2px 0 0 3px;
    color: transparent;
    white-space: nowrap;
    -webkit-text-stroke: 1px rgba(117, 24, 40, 0.65);
    opacity: 0.75;
    transform: skewX(-7deg);
  }

  .stage-3 .monster-speech {
    top: 7%;
    left: 8%;
    color: #f0b0b0;
    font-size: clamp(2rem, 6vw, 5.4rem);
    rotate: -11deg;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(5px) rotate(-0.7deg);
    }

    50% {
      transform: translateY(-7px) rotate(0.7deg);
    }
  }

  @keyframes book-float {
    0%,
    100% {
      transform: translate(-50%, 2px) rotate(-2deg);
    }

    50% {
      transform: translate(-50%, -7px) rotate(1deg);
    }
  }

  @keyframes form-change {
    0% {
      opacity: 0.25;
      transform: scale(0.9);
    }

    12% {
      transform: translate(-9px, 4px) scale(1.02);
    }

    25% {
      transform: translate(8px, -5px);
    }

    38% {
      transform: translate(-7px, -2px);
    }

    52% {
      transform: translate(6px, 4px);
    }

    67% {
      transform: translate(-4px, 1px);
    }

    82% {
      transform: translate(3px, -2px);
    }

    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes speech-twitch {
    0%,
    100% {
      transform: skewX(-3deg);
    }

    45% {
      transform: translate(2px, -1px) skewX(2deg);
    }

    55% {
      transform: translate(-1px, 1px) skewX(-5deg);
    }
  }

  @media (max-width: 430px), (max-height: 390px) {
    .book {
      bottom: 9%;
      width: min(40vw, 8.625rem);
    }
  }
</style>
