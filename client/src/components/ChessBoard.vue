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
      }"
      @click="emit('square-click', square.name)"
    >
      <ChessPiece
        v-if="position[square.name]"
        :piece="position[square.name]"
      />
    </BoardPiece>
  </div>
</template>

<script lang="ts" setup>
import BoardPiece from 'components/BoardPiece.vue';
import ChessPiece from 'components/ChessPiece.vue';
import { FILES, RANKS, Position, startingPosition } from 'components/chessAssets';

interface Props {
  position?: Position;
  selected?: string | null;
  highlights?: string[];
  check?: string | null;
}
withDefaults(defineProps<Props>(), {
  position: () => startingPosition(),
  selected: null,
  highlights: () => [],
  check: null,
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
</style>
