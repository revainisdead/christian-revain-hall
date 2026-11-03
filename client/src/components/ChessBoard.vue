<template>
  <div class="board">
    <BoardPiece
      v-for="square in squares"
      :key="square.name"
      :name="square.name"
      :dark="square.dark"
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
}
withDefaults(defineProps<Props>(), {
  position: () => startingPosition(),
});

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
</style>
