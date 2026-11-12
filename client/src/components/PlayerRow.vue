<template>
  <!-- A boxed bar attached to the board: the header (Black, top) or footer (White, bottom).
       The bar of the side to move lights up in that side's color and shows "to move" on the right. -->
  <div
    class="player-bar"
    :class="[color === 'w' ? 'white' : 'black', edge, { active }]"
    :data-testid="`player-${color}`"
  >
    <span class="name">{{ color === 'w' ? 'White Player' : 'Black Player' }}</span>
    <span v-if="active" class="turn-label">to move</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ color: 'w' | 'b'; active: boolean; edge: 'top' | 'bottom' }>();
</script>

<style scoped>
.player-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 404px; /* the board plus its 2px border */
  height: 36px;
  padding: 0 12px;
  border: 2px solid #3a2a20;
  font-weight: 500;
  transition: background 0.25s, color 0.25s, box-shadow 0.25s;
}
.player-bar.top {
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
}
.player-bar.bottom {
  border-top: 0;
  border-radius: 0 0 6px 6px;
}
.turn-label {
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
/* Black's bar is black, White's is white; the side waiting is dimmed. */
.player-bar.black {
  background: #000;
  color: rgba(255, 255, 255, 0.55);
}
.player-bar.white {
  background: #fff;
  color: rgba(0, 0, 0, 0.45);
}
/* The side to move: full-strength text and a gold glow. */
.player-bar.black.active {
  color: #fff;
  box-shadow: 0 -4px 16px rgba(200, 161, 101, 0.9);
}
.player-bar.white.active {
  color: #111;
  box-shadow: 0 4px 16px rgba(200, 161, 101, 0.9);
}
</style>
