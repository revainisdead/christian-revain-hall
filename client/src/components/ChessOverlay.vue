<template>
  <canvas
    ref="canvas"
    class="chess-overlay"
    :width="SIZE"
    :height="SIZE"
    :data-arrow-count="arrows.length"
    :data-arrows="arrowKeys"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Arrow, ArrowKind } from 'components/chessAssets';

interface Props {
  arrows?: Arrow[];
}
const props = withDefaults(defineProps<Props>(), {
  arrows: () => [],
});

// Fixed for now; DPR + ResizeObserver sizing is in plans/ui-plan.md (arrow system).
const SIZE = 400;
const SQUARE = SIZE / 8;

/** Default look per kind. Preview arrows are thinner and fainter so the pieces stay readable. */
const STYLE: Record<ArrowKind, { color: string; width: number; head: number }> = {
  test: { color: 'rgba(220, 30, 30, 0.85)', width: 6, head: 12 },
  preview: { color: 'rgba(200, 20, 20, 0.6)', width: 5, head: 11 },
  // All-moves experiment: 50% white / 50% black, and wider so the faint lines still read.
  'all-w': { color: 'rgba(255, 255, 255, 0.5)', width: 9, head: 16 },
  'all-b': { color: 'rgba(0, 0, 0, 0.5)', width: 9, head: 16 },
};

/** For tests: a JSON list of `from-to-kind`, sorted. */
const arrowKeys = computed(() =>
  JSON.stringify(props.arrows.map((a) => `${a.from}-${a.to}-${a.kind ?? 'test'}`).sort())
);

const canvas = ref<HTMLCanvasElement | null>(null);

function squareCenter(square: string) {
  const file = square.charCodeAt(0) - 97; // a = 0
  const rank = 8 - parseInt(square[1], 10); // rank 8 at the top
  return { x: file * SQUARE + SQUARE / 2, y: rank * SQUARE + SQUARE / 2 };
}

function drawArrow(ctx: CanvasRenderingContext2D, { from, to, color, kind = 'test' }: Arrow) {
  const style = STYLE[kind];
  const center = squareCenter(from);
  const end = squareCenter(to);
  const angle = Math.atan2(end.y - center.y, end.x - center.x);
  const head = style.head;
  // Start near the edge of the origin piece, not its center, so the piece stays visible.
  const lift = SQUARE * 0.3;
  const start = { x: center.x + lift * Math.cos(angle), y: center.y + lift * Math.sin(angle) };

  ctx.strokeStyle = color ?? style.color;
  ctx.fillStyle = color ?? style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = 'round';

  // Stop the shaft at the base of the head so the tip stays sharp.
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x - head * Math.cos(angle), end.y - head * Math.sin(angle));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - head * 1.4 * Math.cos(angle - Math.PI / 6),
    end.y - head * 1.4 * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    end.x - head * 1.4 * Math.cos(angle + Math.PI / 6),
    end.y - head * 1.4 * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/** Redraw from state: clear, then draw every arrow. Never draws incrementally. */
function redraw() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, SIZE, SIZE);
  props.arrows.forEach((arrow) => drawArrow(ctx, arrow));
}

onMounted(redraw);
watch(() => props.arrows, redraw, { deep: true });
</script>

<style>
.chess-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* clicks go through to the board */
  z-index: 10;
}
</style>
