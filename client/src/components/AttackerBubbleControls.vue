<template>
  <q-card bordered data-testid="bubble-controls">
    <q-card-section class="row items-center justify-between q-pb-none">
      <div class="text-subtitle1">Attacker bubbles</div>
      <div class="legend text-caption">
        <span class="dot mine" /> yours <span class="dot theirs" /> theirs
      </div>
    </q-card-section>
    <q-card-section class="row q-col-gutter-sm">
      <div class="col-6">
        <q-select
          :model-value="mode"
          :options="MODES"
          emit-value
          map-options
          dense
          outlined
          label="Show on"
          data-testid="bubble-mode"
          @update:model-value="emit('update:mode', $event)"
        />
      </div>
      <div class="col-6">
        <q-select
          :model-value="viewAs"
          :options="VIEWS"
          emit-value
          map-options
          dense
          outlined
          label="You are"
          data-testid="bubble-view-as"
          @update:model-value="emit('update:viewAs', $event)"
        />
      </div>
    </q-card-section>
  </q-card>
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
.legend {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 6px;
}
.dot.mine {
  background: #2e7d32;
}
.dot.theirs {
  background: #c62828;
}
</style>
