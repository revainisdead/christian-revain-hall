<template>
  <div class="board">
    <BoardPiece
      v-for="square in squares"
      :key="square.name"
      :name="square.name"
      :dark="square.dark"
      :class="{
        selected: square.name === selected,
        'last-move': highlights.includes(square.name),
        'in-check': square.name === check,
        'move-target': targets.includes(square.name) && !victims.includes(square.name),
        'capture-target': victims.includes(square.name),
      }"
      :data-attackers-mine="counts[square.name]?.mine"
      :data-attackers-theirs="counts[square.name]?.theirs"
      @click="emit('square-click', square.name)"
    >
      <ChessPiece
        v-if="position[square.name]"
        :piece="position[square.name]"
      />
      <!-- Attack counts: yours bottom-left (green), the opponent's bottom-right (red). -->
      <template v-if="counts[square.name]">
        <span
          v-if="counts[square.name].mine"
          class="attack-count mine"
          :title="`${counts[square.name].mine} of your pieces attack ${square.name}`"
        >{{ counts[square.name].mine }}</span>
        <span
          v-if="counts[square.name].theirs"
          class="attack-count theirs"
          :title="`${counts[square.name].theirs} opponent pieces attack ${square.name}`"
        >{{ counts[square.name].theirs }}</span>
      </template>
    </BoardPiece>
  </div>
</template>

<script lang="ts" setup>
import BoardPiece from 'components/BoardPiece.vue';
import ChessPiece from 'components/ChessPiece.vue';
import { FILES, RANKS, Position, startingPosition } from 'components/chessAssets';
import { SquareCount } from 'components/attackMap';

interface Props {
  position?: Position;
  selected?: string | null;
  highlights?: string[];
  check?: string | null;
  targets?: string[]; // move preview: where the selected piece can go
  victims?: string[]; // move preview: enemy pieces it could capture (marked for destruction)
  counts?: Record<string, SquareCount>; // attack-count layer; squares left out show nothing
}
withDefaults(defineProps<Props>(), {
  position: () => startingPosition(),
  selected: null,
  highlights: () => [],
  check: null,
  targets: () => [],
  victims: () => [],
  counts: () => ({}),
});

const emit = defineEmits<{ (e: 'square-click', square: string): void }>();

// Rendered top-left (a8) to bottom-right (h1), white at the bottom.
// a1 is a dark square: file index + rank index (both 0-based) even => dark.
const squares = RANKS.flatMap((rank) =>
  FILES.map((file, fileIdx) => ({
    name: `${file}${rank}`,
    dark: (fileIdx + rank - 1) % 2 === 0,
  }))
);
</script>

<style>
.board {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
}
.board .board-square {
  cursor: pointer;
}
/* Tints sit on top of the square PNG via an inset shadow. */
.board .board-square.last-move {
  box-shadow: inset 0 0 0 100px rgba(255, 214, 0, 0.35);
}
.board .board-square.in-check {
  box-shadow: inset 0 0 18px 6px rgba(220, 0, 0, 0.85);
}
.board .board-square.selected {
  box-shadow: inset 0 0 0 100px rgba(255, 214, 0, 0.6);
}

/* Attack-count badges, above the piece and the preview marks. */
.board .attack-count {
  position: absolute;
  bottom: 2px;
  z-index: 2;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 8px;
  font: 700 11px/15px sans-serif;
  text-align: center;
  color: #fff;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
}
.board .attack-count.mine {
  left: 2px;
  background: #2e7d32;
}
.board .attack-count.theirs {
  right: 2px;
  background: #c62828;
}

/* Move preview: a red dot on each quiet destination. */
.board .board-square.move-target::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle, rgba(200, 30, 30, 0.55) 0 15%, transparent 16%);
}
/* Marked for destruction: a red tint plus a pulsing crosshair ring over the enemy piece. */
.board .board-square.capture-target {
  box-shadow: inset 0 0 0 100px rgba(220, 0, 0, 0.28);
}
.board .board-square.capture-target::after {
  content: '';
  position: absolute;
  inset: 4%;
  z-index: 1;
  pointer-events: none;
  border: 3px solid rgba(230, 0, 0, 0.95);
  border-radius: 50%;
  box-shadow: 0 0 10px 2px rgba(255, 0, 0, 0.7), inset 0 0 8px rgba(255, 0, 0, 0.6);
  background:
    linear-gradient(rgba(230, 0, 0, 0.9), rgba(230, 0, 0, 0.9)) center top / 3px 18% no-repeat,
    linear-gradient(rgba(230, 0, 0, 0.9), rgba(230, 0, 0, 0.9)) center bottom / 3px 18% no-repeat,
    linear-gradient(rgba(230, 0, 0, 0.9), rgba(230, 0, 0, 0.9)) left center / 18% 3px no-repeat,
    linear-gradient(rgba(230, 0, 0, 0.9), rgba(230, 0, 0, 0.9)) right center / 18% 3px no-repeat;
  animation: marked-for-destruction 0.9s ease-in-out infinite alternate;
}
@keyframes marked-for-destruction {
  from {
    transform: scale(0.92);
    opacity: 0.75;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .board .board-square.capture-target::after {
    animation: none;
  }
}
</style>
