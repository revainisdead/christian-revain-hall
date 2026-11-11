<template>
  <div
    class="player-row"
    :class="[color === 'w' ? 'white' : 'black', { active }]"
    :data-testid="`player-${color}`"
  >
    <span class="turn-disc" />
    <span>{{ color === 'w' ? 'White' : 'Black' }}</span>
    <span v-if="active" class="turn-label">to move</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ color: 'w' | 'b'; active: boolean }>();
</script>

<style scoped>
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
.white .turn-disc {
  background: #fff;
}
.black .turn-disc {
  background: #222;
}
.white.active .turn-disc {
  box-shadow: 0 0 8px 3px rgba(255, 255, 255, 0.95);
}
.black.active .turn-disc {
  box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.9);
}
.turn-label {
  font-size: 0.85em;
  opacity: 0.85;
}
</style>
