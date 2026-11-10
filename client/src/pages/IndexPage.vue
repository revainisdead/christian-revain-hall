<template>
  <q-page class="index-page row items-start justify-center q-pa-lg q-gutter-lg">
    <!-- Player rows above/below the board (Black on top, White at the bottom); the side to move glows. -->
    <div class="board-column" :class="turnClass">
      <div class="player-row black" :class="{ active: isTurn('b') }" data-testid="player-b">
        <span class="turn-disc" />
        <span>Black</span>
        <span v-if="isTurn('b')" class="turn-label">to move</span>
      </div>

      <div class="board-container" data-testid="board">
        <ChessBoard
          :position="game.position.value"
          :selected="selected"
          :highlights="lastMoveSquares"
          :check="game.checkSquare.value"
          @square-click="onSquareClick"
        />
        <ChessOverlay :arrows="arrows" />
      </div>

      <div class="player-row white" :class="{ active: isTurn('w') }" data-testid="player-w">
        <span class="turn-disc" />
        <span>White</span>
        <span v-if="isTurn('w')" class="turn-label">to move</span>
      </div>
    </div>

    <div class="column q-gutter-y-md side-panels">
      <!-- Chess controls -->
      <q-card bordered data-testid="chess-controls">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-subtitle1">Moves</div>
          <q-badge
            :color="game.status.value.over ? 'primary' : isTurn('w') ? 'grey-2' : 'grey-9'"
            :text-color="isTurn('w') ? 'black' : 'white'"
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

    <!-- Promotion picker -->
    <q-dialog v-model="promotion.open" @hide="settlePromotion(null)">
      <q-card data-testid="promotion-picker">
        <q-card-section class="text-subtitle1">Promote to</q-card-section>
        <q-card-section class="row q-gutter-sm">
          <q-btn
            v-for="role in PROMOTION_ROLES"
            :key="role.code"
            flat
            :data-testid="`promote-${role.code}`"
            :aria-label="role.name"
            @click="settlePromotion(role.code)"
          >
            <img :src="pieceImage(`${game.sideToMove.value}_${role.name}`)" :alt="role.name" class="promo-img">
          </q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Playing from an earlier position drops the later moves -->
    <q-dialog v-model="truncate.open" @hide="settleTruncate(false)">
      <q-card data-testid="truncate-confirm">
        <q-card-section>
          Play from here? This discards the {{ game.laterMoves.value }} later
          {{ game.laterMoves.value === 1 ? 'move' : 'moves' }}.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="settleTruncate(false)" />
          <q-btn
            flat
            color="negative"
            label="Discard and play"
            data-testid="truncate-ok"
            @click="settleTruncate(true)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import ChessBoard from 'components/ChessBoard.vue';
import ChessOverlay from 'components/ChessOverlay.vue';
import { Arrow, PieceRole, pieceImage } from 'components/chessAssets';
import { PromotionRole, useBoardHistory } from 'components/useBoardHistory';

const game = useBoardHistory();
const selected = ref<string | null>(null);

const isTurn = (color: 'w' | 'b') => !game.status.value.over && game.sideToMove.value === color;
const turnClass = computed(() => (game.status.value.over ? 'game-over' : `turn-${game.sideToMove.value}`));
const turnLabel = computed(() => {
  if (game.status.value.over) {
    return 'Game over';
  }
  return game.sideToMove.value === 'w' ? 'White to move' : 'Black to move';
});
const resultText = computed(() => {
  const { result, reason } = game.status.value;
  const winner = result === '1-0' ? 'White wins' : result === '0-1' ? 'Black wins' : 'Draw';
  const why = reason ? reason.charAt(0).toUpperCase() + reason.slice(1) : '';
  return `${why}: ${winner} (${result})`;
});

const PROMOTION_ROLES: { code: PromotionRole; name: PieceRole }[] = [
  { code: 'q', name: 'queen' },
  { code: 'r', name: 'rook' },
  { code: 'b', name: 'bishop' },
  { code: 'n', name: 'knight' },
];

// Promise-backed dialogs: open, then resolve once with the user's choice (closing = cancel).
const promotion = reactive({ open: false, resolve: null as ((r: PromotionRole | null) => void) | null });
const truncate = reactive({ open: false, resolve: null as ((ok: boolean) => void) | null });

function askPromotion(): Promise<PromotionRole | null> {
  return new Promise((resolve) => Object.assign(promotion, { open: true, resolve }));
}
function settlePromotion(role: PromotionRole | null) {
  promotion.resolve?.(role);
  Object.assign(promotion, { open: false, resolve: null });
}
function askTruncate(): Promise<boolean> {
  return new Promise((resolve) => Object.assign(truncate, { open: true, resolve }));
}
function settleTruncate(ok: boolean) {
  truncate.resolve?.(ok);
  Object.assign(truncate, { open: false, resolve: null });
}

/** Returns true when the click was a move attempt (handled), false for an illegal target. */
async function tryMove(from: string, to: string) {
  const kind = game.check(from, to);
  if (kind === 'illegal') {
    return false;
  }
  selected.value = null;
  if (!game.atEnd.value && !(await askTruncate())) {
    return true;
  }
  let role: PromotionRole | undefined;
  if (kind === 'needs-promotion') {
    role = (await askPromotion()) ?? undefined;
    if (!role) {
      return true;
    }
  }
  game.move(from, to, role);
  return true;
}

const lastMoveSquares = computed(() => {
  const m = game.lastMove.value;
  return m ? [m.from, m.to] : [];
});

async function onSquareClick(square: string) {
  if (selected.value && (await tryMove(selected.value, square))) {
    return;
  }
  // Select (or switch to) a piece of the side to move that has a legal move; anything else deselects.
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
  if (e.target instanceof HTMLInputElement || promotion.open || truncate.open) {
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
.index-page {
  background: linear-gradient(135deg, #0f9b8e 0%, #1565c0 100%);
}
/* Turn glow on the edge of the side to move, in that side's color (White bottom, Black top for now). */
.turn-w .board-container {
  box-shadow: 0 12px 16px -6px rgba(255, 255, 255, 0.95);
}
.turn-b .board-container {
  box-shadow: 0 -12px 16px -6px rgba(0, 0, 0, 0.9);
}

.player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 4px;
  font-weight: 500;
  color: #fff;
  opacity: 0.5;
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
.player-row.white.active .turn-disc {
  box-shadow: 0 0 8px 3px rgba(255, 255, 255, 0.95);
}
.player-row.black.active .turn-disc {
  box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.9);
}
.turn-label {
  font-size: 0.85em;
  opacity: 0.85;
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
.game-result {
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  background: #e3f2fd;
}
.promo-img {
  width: 56px;
  height: 56px;
}
</style>
