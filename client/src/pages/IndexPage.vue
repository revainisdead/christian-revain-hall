<template>
  <q-page class="index-page row items-start justify-center q-pa-lg q-gutter-lg">
    <!-- Left: Pieces under attack over the move history, equal halves of the board's height. -->
    <div class="left-column">
      <ThreatList :threats="threats" :me="me" @preview="openBattle" />
      <MoveControls :game="game" />
    </div>

    <!-- The board with its controls panel close on the right (one gutter item, so the gap stays small). -->
    <div class="board-area row no-wrap items-start">
      <!-- Bubble dropdowns, then the board boxed by player bars (Black on top, White at the bottom);
           the bar of the side to move lights up. -->
      <div class="board-column" :class="turnClass">
        <div class="board-tools row no-wrap items-center">
          <AttackerBubbleControls v-model:mode="bubbleMode" v-model:view-as="viewAs" />
        </div>
        <PlayerRow color="b" edge="top" :active="isTurn('b')" />

        <div class="board-container" data-testid="board">
          <ChessBoard
            :position="game.position.value"
            :selected="selected"
            :highlights="lastMoveSquares"
            :check="game.checkSquare.value"
            :targets="preview.map((m) => m.to)"
            :victims="preview.flatMap((m) => (m.victim ? [m.victim] : []))"
            :bubbles="bubbles"
            @square-click="onSquareClick"
          />
          <ChessOverlay :arrows="overlayArrows" />
        </div>

        <PlayerRow color="w" edge="bottom" :active="isTurn('w')" />
      </div>

      <ControlsPanel class="controls-panel">
        <AllMovesButton v-model="allMoves" />
      </ControlsPanel>
    </div>

    <!-- Arrows (testing) card: hidden for now; the component is kept.
    <ArrowControls v-model:arrows="arrows" :last-move="game.lastMove.value" />
    -->

    <PromotionDialog ref="promotionDialog" :color="game.sideToMove.value" />
    <TruncateDialog ref="truncateDialog" :later-moves="game.laterMoves.value" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// import ArrowControls from 'components/ArrowControls.vue'; // Arrows (testing) card, hidden for now
import AllMovesButton from 'components/AllMovesButton.vue';
import ControlsPanel from 'components/ControlsPanel.vue';
import AttackerBubbleControls from 'components/AttackerBubbleControls.vue';
import ChessBoard from 'components/ChessBoard.vue';
import ChessOverlay from 'components/ChessOverlay.vue';
import MoveControls from 'components/MoveControls.vue';
import PlayerRow from 'components/PlayerRow.vue';
import PromotionDialog from 'components/PromotionDialog.vue';
import ThreatList from 'components/ThreatList.vue';
import TruncateDialog from 'components/TruncateDialog.vue';
import { Arrow, PieceColor } from 'components/chessAssets';
import { useRouter } from 'vue-router';
import { BubbleMode, ViewAs, battleOn, attackerBubbles, threatsTo } from 'components/attackMap';
import { toPlacement } from 'components/chessAssets';
import { previewArrows } from 'components/movePreview';
import { PromotionRole, useBoardHistory } from 'components/useBoardHistory';
import sampleGame from 'src/samples/sample-game.json';
import { ENABLE_SAMPLE_GAME_LOAD } from 'src/settings';

const game = useBoardHistory();
if (ENABLE_SAMPLE_GAME_LOAD) {
  game.load(sampleGame.moves);
}
const selected = ref<string | null>(null);
const arrows = ref<Arrow[]>([]);
const promotionDialog = ref<InstanceType<typeof PromotionDialog> | null>(null);
const truncateDialog = ref<InstanceType<typeof TruncateDialog> | null>(null);

const router = useRouter();

const isTurn = (color: 'w' | 'b') => !game.status.value.over && game.sideToMove.value === color;
const turnClass = computed(() => (game.status.value.over ? 'game-over' : `turn-${game.sideToMove.value}`));
// Move preview: the selected piece's legal destinations (arrows, dots, capture marks).
const preview = computed(() => (selected.value ? game.previewMoves(selected.value) : []));
// Experimental "All moves": every piece's moves at once, white and black (drawn underneath).
const allMoves = ref(false);
const allMoveArrows = computed(() =>
  allMoves.value
    ? (['w', 'b'] as const).flatMap((color) =>
        Object.entries(game.reachFor(color)).flatMap(([from, moves]) =>
          previewArrows(from, moves, color === 'w' ? 'all-w' : 'all-b')
        )
      )
    : []
);
const overlayArrows = computed(() => [
  ...allMoveArrows.value,
  ...(selected.value ? previewArrows(selected.value, preview.value) : []),
  ...arrows.value,
]);
// Attack layer and threat list. "You" is the side to move unless a color is picked.
// Attacker bubbles show on occupied squares by default; the dropdown can switch to all or off.
const bubbleMode = ref<BubbleMode>('occupied');
const viewAs = ref<ViewAs>('auto');
const me = computed<PieceColor>(() => (viewAs.value === 'auto' ? game.sideToMove.value : viewAs.value));
const bubbles = computed(() =>
  attackerBubbles(game.attackers.value, game.position.value, me.value, bubbleMode.value)
);
const threats = computed(() => threatsTo(game.attackers.value, game.position.value, me.value));

/**
 * Open a new tab with a bare board showing the position once the battle on `square` is over.
 * The battle is worked out here; the battle page only draws the board it's given.
 */
function openBattle(square: string) {
  const { steps } = battleOn(square, game.attackers.value, game.position.value, me.value);
  const after = steps.length ? steps[steps.length - 1].position : game.position.value;
  const href = router.resolve({ name: 'battle', query: { board: toPlacement(after), square } }).href;
  window.open(href, '_blank');
}

// A selection belongs to one position: stepping through history drops it (and its preview).
watch(game.ply, () => (selected.value = null));

const lastMoveSquares = computed(() => {
  const m = game.lastMove.value;
  return m ? [m.from, m.to] : [];
});

/** Returns true when the click was a move attempt (handled), false for an illegal target. */
async function tryMove(from: string, to: string) {
  const kind = game.check(from, to);
  if (kind === 'illegal') {
    return false;
  }
  selected.value = null;
  if (!game.atEnd.value && !(await truncateDialog.value?.ask())) {
    return true;
  }
  let role: PromotionRole | undefined;
  if (kind === 'needs-promotion') {
    role = (await promotionDialog.value?.ask()) ?? undefined;
    if (!role) {
      return true;
    }
  }
  game.move(from, to, role);
  return true;
}

async function onSquareClick(square: string) {
  if (selected.value && (await tryMove(selected.value, square))) {
    return;
  }
  // Select (or switch to) a piece of the side to move that has a legal move; anything else deselects.
  selected.value = selected.value !== square && game.canMoveFrom(square) ? square : null;
}

// Keyboard: left/right step, Home/End jump (ignored while typing or while a dialog is open).
function onKey(e: KeyboardEvent) {
  if (
    e.target instanceof HTMLInputElement ||
    promotionDialog.value?.open ||
    truncateDialog.value?.open
  ) {
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
.index-page {
  background: var(--bp-page-bg);
}
.board-container {
  position: relative;
  width: 400px;
  height: 400px;
  box-sizing: content-box;
  border: 2px solid #3a2a20;
  transition: box-shadow 0.25s;
}
.board-tools {
  width: 404px; /* lines up with the board and the player bars */
  height: 40px;
  margin-bottom: 10px;
}
/* Left column: as tall as the board column (tools 50 + bars 2 x 36 + board 404), split evenly. */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 290px;
  height: 526px;
}
.left-column > .q-card {
  flex: 1 1 0;
  min-height: 0;
}
/* Close to the board, not attached; its top lines up with the Black Player bar. */
.controls-panel {
  margin-left: 8px;
  margin-top: 50px;
}
</style>
