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

// KEEP: reference for resolving a public/ asset URL via import.meta.url (not used for rendering).
const fileUrl = new URL('/JohnPablok Cburnett Chess set/SVG No shadow/b_bishop_svg_NoShadow"', import.meta.url).href;

console.log('file url test:', fileUrl)
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
