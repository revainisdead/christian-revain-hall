<template>
  <!-- Two dropdowns in a slim row above the board (no card or header). -->
  <div class="bubble-controls row no-wrap" data-testid="bubble-controls">
    <q-select
      class="col"
      :model-value="mode"
      :options="MODES"
      emit-value
      map-options
      dense
      filled
      bg-color="white"
      label="Attacker bubbles"
      data-testid="bubble-mode"
      @update:model-value="emit('update:mode', $event)"
    />
    <q-select
      class="col"
      :model-value="viewAs"
      :options="VIEWS"
      emit-value
      map-options
      dense
      filled
      bg-color="white"
      label="You are"
      data-testid="bubble-view-as"
      @update:model-value="emit('update:viewAs', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { BubbleMode, ViewAs } from 'components/attackMap';

defineProps<{ mode: BubbleMode; viewAs: ViewAs }>();
const emit = defineEmits<{
  (e: 'update:mode', mode: BubbleMode): void;
  (e: 'update:viewAs', viewAs: ViewAs): void;
}>();

const MODES: { label: string; value: BubbleMode }[] = [
  { label: 'Pieces only', value: 'occupied' },
  { label: 'All squares', value: 'all' },
  { label: 'Off', value: 'off' },
];
// Until games record your color (UI plan step 3), "you" defaults to the side to move.
const VIEWS: { label: string; value: ViewAs }[] = [
  { label: 'Side to move', value: 'auto' },
  { label: 'White', value: 'w' },
  { label: 'Black', value: 'b' },
];
</script>

<style scoped>
.bubble-controls {
  width: 404px; /* lines up with the board and the player bars */
  margin-bottom: 10px;
}
.bubble-controls > .q-select + .q-select {
  margin-left: 8px;
}
</style>
