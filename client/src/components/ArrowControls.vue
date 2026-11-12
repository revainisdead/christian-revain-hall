<template>
  <!-- Test controls for the overlay. Annotations aren't saved (training-tool plan 1b). -->
  <q-card bordered data-testid="arrow-controls">
    <q-card-section class="row items-center justify-between q-pb-none">
      <div class="text-subtitle1">Arrows (testing)</div>
      <q-badge color="grey-6" :label="`${arrows.length} drawn`" />
    </q-card-section>

    <q-card-section>
      <q-form class="row items-center q-gutter-x-sm" @submit="addArrow">
        <q-input
          v-model="arrowFrom"
          dense
          outlined
          label="From"
          class="square-input"
          :rules="[isSquare]"
          hide-bottom-space
        />
        <q-input
          v-model="arrowTo"
          dense
          outlined
          label="To"
          class="square-input"
          :rules="[isSquare]"
          hide-bottom-space
        />
        <q-btn type="submit" dense color="primary" label="Draw" data-testid="arrow-draw" />
      </q-form>
    </q-card-section>

    <q-card-actions>
      <q-btn
        dense
        unelevated
        :color="allMoves ? 'primary' : 'grey-3'"
        :text-color="allMoves ? 'white' : 'grey-9'"
        icon="open_with"
        label="All moves"
        data-testid="all-moves"
        :aria-pressed="allMoves"
        @click="emit('update:allMoves', !allMoves)"
      >
        <q-tooltip>Experimental: every piece's moves, white and black</q-tooltip>
      </q-btn>
      <q-btn dense flat label="Sample set" @click="drawSamples" />
      <q-btn dense flat label="Last move" :disable="!lastMove" @click="drawLastMove" />
      <q-btn
        dense
        flat
        label="Undo arrow"
        :disable="!arrows.length"
        @click="emit('update:arrows', arrows.slice(0, -1))"
      />
      <q-btn
        dense
        flat
        color="negative"
        label="Clear"
        data-testid="arrow-clear"
        :disable="!arrows.length"
        @click="emit('update:arrows', [])"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Arrow } from 'components/chessAssets';

const props = defineProps<{
  arrows: Arrow[];
  lastMove: { from: string; to: string } | null;
  allMoves: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:arrows', arrows: Arrow[]): void;
  (e: 'update:allMoves', on: boolean): void;
}>();

const arrowFrom = ref('e2');
const arrowTo = ref('e4');
const SQUARE_RE = /^[a-h][1-8]$/;
const isSquare = (v: string) => SQUARE_RE.test(v.trim().toLowerCase()) || 'a1–h8';

const push = (...added: Arrow[]) => emit('update:arrows', [...props.arrows, ...added]);

function addArrow() {
  push({ from: arrowFrom.value.trim().toLowerCase(), to: arrowTo.value.trim().toLowerCase() });
}

function drawSamples() {
  push(
    { from: 'e2', to: 'e4' },
    { from: 'g1', to: 'f3', color: 'rgba(30, 140, 60, 0.85)' },
    { from: 'd8', to: 'h4', color: 'rgba(30, 90, 200, 0.85)' }
  );
}

function drawLastMove() {
  const m = props.lastMove;
  if (m) {
    push({ from: m.from, to: m.to, color: 'rgba(255, 170, 0, 0.9)' });
  }
}
</script>

<style scoped>
.square-input {
  width: 72px;
}
</style>
