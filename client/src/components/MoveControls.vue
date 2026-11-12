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

    <!-- One line per move ("1. e4 e5"), about 5 lines tall; scrolls to keep the current move in view. -->
    <q-card-section class="q-pt-none">
      <div ref="list" class="move-list" data-testid="move-list">
        <span v-if="!rows.length" class="text-grey-7">Click a piece, then a square.</span>
        <div v-for="row in rows" :key="row.number" class="move-row" data-testid="move-row">
          <span class="num text-grey-7">{{ row.number }}.</span>{{ ' ' }}
          <span
            v-for="half in row.plies"
            :key="half.ply"
            class="move"
            :class="{ current: half.ply === game.ply.value }"
            @click="game.goTo(half.ply)"
          >{{ half.san }}{{ ' ' }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { BoardHistory } from 'components/useBoardHistory';

const props = defineProps<{ game: BoardHistory }>();

/** Moves paired per line: { number, plies: [White's, Black's?] }, each with its ply for goTo. */
const rows = computed(() =>
  props.game.moves.value
    .map((san, i) => ({ san, ply: i + 1 }))
    .reduce<{ number: number; plies: { san: string; ply: number }[] }[]>(
      (acc, half, i) =>
        i % 2 === 0
          ? [...acc, { number: i / 2 + 1, plies: [half] }]
          : [...acc.slice(0, -1), { ...acc[acc.length - 1], plies: [...acc[acc.length - 1].plies, half] }],
      []
    )
);

// Keep the current move's line in view: new moves scroll down, stepping back scrolls up.
const list = ref<HTMLElement | null>(null);
watch(
  () => [props.game.ply.value, props.game.moves.value.length],
  async () => {
    await nextTick();
    const box = list.value;
    const line = box?.querySelector('.move.current')?.closest('.move-row') as HTMLElement | null;
    if (!box) {
      return;
    }
    if (!line) {
      box.scrollTop = 0;
      return;
    }
    const top = line.offsetTop;
    const bottom = top + line.offsetHeight;
    if (top < box.scrollTop) {
      box.scrollTop = top;
    } else if (bottom > box.scrollTop + box.clientHeight) {
      box.scrollTop = bottom - box.clientHeight;
    }
  },
  { immediate: true }
);

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
  position: relative; /* offsetTop of each line is measured from here */
  max-height: calc(5 * 26px); /* about 5 moves in view */
  overflow-y: auto;
  font-family: monospace;
}
.move-row {
  display: grid;
  grid-template-columns: 3em 1fr 1fr;
  align-items: center;
  height: 26px;
}
.move-list .move {
  justify-self: start; /* highlight hugs the move, not the whole column */
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
