<template>
  <q-page class="index-page row items-start justify-center q-pa-lg q-gutter-lg">
    <!-- Player rows above/below the board (Black on top, White at the bottom); the side to move glows. -->
    <div class="board-column" :class="`turn-${game.sideToMove.value}`">
      <div class="player-row black" :class="{ active: game.sideToMove.value === 'b' }" data-testid="player-b">
        <span class="turn-disc" />
        <span>Black</span>
        <span v-if="game.sideToMove.value === 'b'" class="turn-label">to move</span>
      </div>

      <div class="board-container" data-testid="board">
        <ChessBoard
          :position="game.position.value"
          :selected="selected"
          :highlights="lastMoveSquares"
          @square-click="onSquareClick"
        />
        <ChessOverlay :arrows="arrows" />
      </div>

      <div class="player-row white" :class="{ active: game.sideToMove.value === 'w' }" data-testid="player-w">
        <span class="turn-disc" />
        <span>White</span>
        <span v-if="game.sideToMove.value === 'w'" class="turn-label">to move</span>
      </div>
    </div>

    <div class="column q-gutter-y-md side-panels">
      <!-- Chess controls -->
      <q-card bordered data-testid="chess-controls">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1">Moves</div>
          <q-badge
            :color="game.sideToMove.value === 'w' ? 'grey-2' : 'grey-9'"
            :text-color="game.sideToMove.value === 'w' ? 'black' : 'white'"
            data-testid="side-to-move"
            :label="game.sideToMove.value === 'w' ? 'White to move' : 'Black to move'"
          />
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
            {{ m.from }}-{{ m.to }}
          </span>
        </q-card-section>
      </q-card>

      <!-- Arrow / drawing test controls -->
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
            <q-btn
              type="submit"
              dense
              color="primary"
              label="Draw"
              data-testid="arrow-draw"
            />
          </q-form>
        </q-card-section>

        <q-card-actions>
          <q-btn dense flat label="Sample set" @click="drawSamples" />
          <q-btn
            dense
            flat
            label="Last move"
            :disable="!game.lastMove.value"
            @click="drawLastMove"
          />
          <q-btn
            dense
            flat
            label="Undo arrow"
            :disable="!arrows.length"
            @click="arrows.pop()"
          />
          <q-btn
            dense
            flat
            color="negative"
            label="Clear"
            data-testid="arrow-clear"
            :disable="!arrows.length"
            @click="arrows = []"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ChessBoard from 'components/ChessBoard.vue';
import ChessOverlay from 'components/ChessOverlay.vue';
import { Arrow } from 'components/chessAssets';
import { useBoardHistory } from 'components/useBoardHistory';

const game = useBoardHistory();
const selected = ref<string | null>(null);

const lastMoveSquares = computed(() => {
  const m = game.lastMove.value;
  return m ? [m.from, m.to] : [];
});

function onSquareClick(square: string) {
  if (selected.value && game.move(selected.value, square)) {
    selected.value = null;
    return;
  }
  // Select (or switch to) a piece of the side to move; anything else deselects.
  selected.value = selected.value !== square && game.canMoveFrom(square) ? square : null;
}

// Arrows: test controls for the overlay. Annotations aren't saved (training-tool plan 1b).
const arrows = ref<Arrow[]>([]);
const arrowFrom = ref('e2');
const arrowTo = ref('e4');
const SQUARE_RE = /^[a-h][1-8]$/;
const isSquare = (v: string) => SQUARE_RE.test(v.trim().toLowerCase()) || 'a1–h8';

function addArrow() {
  arrows.value.push({ from: arrowFrom.value.trim().toLowerCase(), to: arrowTo.value.trim().toLowerCase() });
}

function drawSamples() {
  arrows.value.push(
    { from: 'e2', to: 'e4' },
    { from: 'g1', to: 'f3', color: 'rgba(30, 140, 60, 0.85)' },
    { from: 'd8', to: 'h4', color: 'rgba(30, 90, 200, 0.85)' }
  );
}

function drawLastMove() {
  const m = game.lastMove.value;
  if (m) {
    arrows.value.push({ from: m.from, to: m.to, color: 'rgba(255, 170, 0, 0.9)' });
  }
}

// Keyboard: left/right step, Home/End jump (ignored while typing in an input).
function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) {
    return;
  }
  const actions: Record<string, () => void> = {
    ArrowLeft: game.back,
    ArrowRight: game.forward,
    Home: game.toStart,
    End: game.toEnd,
    Escape: () => (selected.value = null),
  };
  const action = actions[e.key];
  if (action) {
    e.preventDefault();
    action();
  }
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style>
.board-container {
  position: relative;
  width: 400px;
  height: 400px;
  box-sizing: content-box;
  border: 2px solid #3a2a20;
  transition: box-shadow 0.25s;
}
/* Turn glow on the edge of the side to move (White bottom, Black top for now). */
.turn-w .board-container {
  box-shadow: 0 10px 14px -6px rgba(255, 196, 0, 0.9);
}
.turn-b .board-container {
  box-shadow: 0 -10px 14px -6px rgba(255, 196, 0, 0.9);
}

.player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 4px;
  font-weight: 500;
  opacity: 0.45;
  transition: opacity 0.25s;
}
.player-row.active {
  opacity: 1;
}
.turn-disc {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #3a2a20;
}
.player-row.white .turn-disc {
  background: #fff;
}
.player-row.black .turn-disc {
  background: #222;
}
.player-row.active .turn-disc {
  box-shadow: 0 0 0 3px rgba(255, 196, 0, 0.6), 0 0 8px 2px rgba(255, 196, 0, 0.8);
}
.turn-label {
  font-size: 0.85em;
  color: #8a6d00;
}
.side-panels {
  width: 320px;
}
.square-input {
  width: 72px;
}
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
</style>
