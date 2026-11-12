<template>
  <!-- Display only: a fixed position with the training layers drawn on it. No clicks. -->
  <div class="demo-board" data-testid="demo-board" aria-label="BlunderProof board example" role="img">
    <ChessBoard
      :position="game.position.value"
      :selected="SELECTED"
      :targets="preview.map((m) => m.to)"
      :victims="preview.flatMap((m) => (m.victim ? [m.victim] : []))"
      :bubbles="bubbles"
    />
    <ChessOverlay :arrows="arrows" />
  </div>
</template>

<script setup lang="ts">
import ChessBoard from 'components/ChessBoard.vue';
import ChessOverlay from 'components/ChessOverlay.vue';
import { attackerBubbles } from 'components/attackMap';
import { previewArrows } from 'components/movePreview';
import { useBoardHistory } from 'components/useBoardHistory';

// 1. e4 e5 2. Qh5 Nc6, White to move, queen selected: five lines, three Black pieces in reach
// (e5, f7, h7). Checked with python-chess; everything drawn is computed by the app's own code.
const DEMO_MOVES = ['e2e4', 'e7e5', 'd1h5', 'b8c6'];
const SELECTED = 'h5';

const game = useBoardHistory();
game.load(DEMO_MOVES);

const preview = game.previewMoves(SELECTED);
const arrows = previewArrows(SELECTED, preview);
const bubbles = attackerBubbles(game.attackers.value, game.position.value, 'w', 'occupied');
</script>

<style scoped>
.demo-board {
  position: relative;
  width: min(88vw, 420px);
  aspect-ratio: 1;
  border: 2px solid #3a2a20;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  pointer-events: none; /* a picture, not a game */
}
</style>
