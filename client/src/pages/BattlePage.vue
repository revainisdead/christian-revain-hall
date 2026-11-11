<template>
  <!-- Display only: the board once the battle is over. No controls, no analysis. -->
  <q-page class="battle-page flex flex-center">
    <div v-if="position" class="battle-board" data-testid="battle-board">
      <ChessBoard :position="position" :selected="square" />
    </div>
    <div v-else class="text-white" data-testid="battle-missing">No board to show.</div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ChessBoard from 'components/ChessBoard.vue';
import { fromPlacement } from 'components/chessAssets';

const route = useRoute();
const position = computed(() => fromPlacement(String(route.query.board ?? '')));
const square = computed(() => {
  const s = String(route.query.square ?? '');
  return /^[a-h][1-8]$/.test(s) ? s : null;
});
</script>

<style scoped>
.battle-page {
  background: linear-gradient(135deg, #0f9b8e 0%, #1565c0 100%);
}
.battle-board {
  position: relative;
  width: min(90vw, 90vh, 640px);
  aspect-ratio: 1;
  border: 2px solid #3a2a20;
}
</style>
