<script lang="ts">
  type Props = {
    label: string;
    seconds: number;
    activeTitle: string;
  };

  let { label, seconds, activeTitle }: Props = $props();
</script>

<div class="distraction-banner" role="alert" aria-live="polite">
  <strong>{label}</strong>
  <span>{seconds}s · {activeTitle}</span>
</div>

<style>
  .distraction-banner {
    color: #ffd9d6;
    text-align: center;
    text-shadow: 0 2px 0.75rem rgba(65, 0, 14, 0.9);
    animation: banner-in 250ms ease both;
  }

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 0.58rem;
    letter-spacing: 0.16em;
  }

  span {
    overflow: hidden;
    margin-top: 0.25rem;
    color: rgba(239, 183, 184, 0.72);
    font-size: 0.56rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes banner-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }
</style>
