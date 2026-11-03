<template>
  <q-page class="row items-center justify-evenly">
    <div class="board-container">
      <ChessBoard />
      <ChessOverlay />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import ChessBoard from 'components/ChessBoard.vue';
import ChessOverlay from 'components/ChessOverlay.vue';
</script>

<style>
.board-container {
  position: relative;
  width: 400px;
  height: 400px;
  box-sizing: content-box;
  border: 2px solid #3a2a20;
}
</style>
