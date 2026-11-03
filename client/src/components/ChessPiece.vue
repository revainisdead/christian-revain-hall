<template>
  <img
    class="chess-piece"
    :src="pieceImage(piece)"
    :alt="piece"
    draggable="false"
  >
</template>

<script setup lang="ts">
import { PieceCode, pieceImage } from 'components/chessAssets';

interface Props {
  piece: PieceCode;
}
defineProps<Props>();
</script>

<style>
.chess-piece {
  position: absolute;
  inset: 4%;
  width: 92%;
  height: 92%;
  object-fit: contain;
  user-select: none;
}
</style>
