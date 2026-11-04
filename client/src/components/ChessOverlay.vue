<template>
  <canvas
    ref="canvas"
    class="chess-overlay"
    :width="SIZE"
    :height="SIZE"
    :data-arrow-count="arrows.length"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Arrow } from 'components/chessAssets';

interface Props {
  arrows?: Arrow[];
}
const props = withDefaults(defineProps<Props>(), {
  arrows: () => [],
});

// Fixed for now; DPR + ResizeObserver sizing is in plans/ui-plan.md (arrow system).
const SIZE = 400;
const SQUARE = SIZE / 8;
const DEFAULT_COLOR = 'rgba(220, 30, 30, 0.85)';

const canvas = ref<HTMLCanvasElement | null>(null);

function squareCenter(square: string) {
  const file = square.charCodeAt(0) - 97; // a = 0
  const rank = 8 - parseInt(square[1], 10); // rank 8 at the top
  return { x: file * SQUARE + SQUARE / 2, y: rank * SQUARE + SQUARE / 2 };
}

function drawArrow(ctx: CanvasRenderingContext2D, { from, to, color = DEFAULT_COLOR }: Arrow) {
  const start = squareCenter(from);
  const end = squareCenter(to);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const head = 12;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;
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
