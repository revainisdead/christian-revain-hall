<template>
  <q-card bordered data-testid="chess-controls">
    <q-card-section class="row items-center justify-between q-pb-none">
      <div class="text-subtitle1">Moves</div>
      <q-badge
        :color="game.status.value.over ? 'primary' : whiteToMove ? 'grey-2' : 'grey-9'"
        :text-color="whiteToMove ? 'black' : 'white'"
        data-testid="side-to-move"
        :label="turnLabel"
      />
    </q-card-section>

    <q-card-section v-if="game.status.value.over" class="q-pb-none">
      <div class="game-result" data-testid="game-result">
        {{ resultText }}
      </div>
    </q-card-section>
    <q-card-section v-else-if="game.status.value.claimable" class="q-pb-none">
      <div class="text-caption text-grey-8" data-testid="draw-claimable">
        Draw can be claimed ({{ game.status.value.claimable }}).
      </div>
    </q-card-section>

    <q-card-section class="row justify-center q-gutter-x-xs">
      <q-btn
        dense
        flat
        icon="first_page"
        aria-label="Start"
        :disable="game.atStart.value"
        @click="game.toStart"
      />
      <q-btn
        dense
        flat
        icon="chevron_left"
        aria-label="Back"
        data-testid="move-back"
        :disable="game.atStart.value"
        @click="game.back"
      />
      <q-btn
        dense
        flat
        icon="chevron_right"
        aria-label="Forward"
        data-testid="move-forward"
        :disable="game.atEnd.value"
        @click="game.forward"
      />
      <q-btn
        dense
        flat
        icon="last_page"
        aria-label="End"
        :disable="game.atEnd.value"
        @click="game.toEnd"
      />
    </q-card-section>

    <q-card-section class="q-pt-none move-list" data-testid="move-list">
      <span v-if="!game.moves.value.length" class="text-grey-7">
        Click a piece, then a square.
      </span>
      <span
        v-for="(m, i) in game.moves.value"
        :key="i"
        class="move"
        :class="{ current: i + 1 === game.ply.value }"
        @click="game.goTo(i + 1)"
      >
        <span v-if="i % 2 === 0" class="text-grey-7">{{ i / 2 + 1 }}.</span>
        {{ m }}
      </span>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BoardHistory } from 'components/useBoardHistory';

const props = defineProps<{ game: BoardHistory }>();

const whiteToMove = computed(
  () => !props.game.status.value.over && props.game.sideToMove.value === 'w'
);
const turnLabel = computed(() => {
  if (props.game.status.value.over) {
    return 'Game over';
  }
  return props.game.sideToMove.value === 'w' ? 'White to move' : 'Black to move';
});
const resultText = computed(() => {
  const { result, reason } = props.game.status.value;
  const winner = result === '1-0' ? 'White wins' : result === '0-1' ? 'Black wins' : 'Draw';
  const why = reason ? reason.charAt(0).toUpperCase() + reason.slice(1) : '';
  return `${why}: ${winner} (${result})`;
});
</script>

<style scoped>
.move-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-family: monospace;
}
.move-list .move {
  cursor: pointer;
  padding: 0 2px;
  border-radius: 3px;
}
.move-list .move.current {
  background: #ffe082;
}
.game-result {
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  background: #e3f2fd;
}
</style>
