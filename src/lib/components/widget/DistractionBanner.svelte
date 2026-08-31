<script lang="ts">
  /** Warning copy is already selected by DistractionStore. */
  type Props = {
    label: string;
    seconds: number;
    activeTitle: string;
  };

  let { label, seconds, activeTitle }: Props = $props();
</script>

<!-- Kept separate so warning copy can evolve independently from creature forms. -->
<div class="warning-caption" role="alert" aria-live="polite">
  <strong>{label}</strong>
  <span>{seconds}s · {activeTitle}</span>
</div>

<style>
  .warning-caption { position: absolute; z-index: 13; left: 50%; top: 9%; max-width: min(82vw,520px); color: #ffd9d6; text-align: center; text-shadow: 0 2px 12px rgba(65,0,14,.9); transform: translateX(-50%); animation: caption-in .25s ease both; }
  .warning-caption strong, .warning-caption span { display: block; }
  .warning-caption strong { font-size: .58rem; letter-spacing: .16em; }
  .warning-caption span { overflow: hidden; margin-top: 4px; color: rgba(239,183,184,.72); font-size: .56rem; text-overflow: ellipsis; white-space: nowrap; }
  @keyframes caption-in { from { opacity: 0; transform: translate(-50%,-4px); } }
</style>
