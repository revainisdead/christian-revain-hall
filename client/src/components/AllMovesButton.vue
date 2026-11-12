<template>
  <!-- Experimental: every piece's moves at once (white and black arrows). -->
  <q-btn
    unelevated
    no-caps
    no-wrap
    padding="0 10px"
    class="all-moves"
    :color="modelValue ? 'primary' : undefined"
    :class="{ off: !modelValue }"
    icon="open_with"
    label="All moves"
    data-testid="all-moves"
    :aria-pressed="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <q-tooltip>Experimental: every piece's moves, white and black</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', on: boolean): void }>();
</script>

<style scoped>
.all-moves {
  height: 40px; /* same height as the dense dropdowns */
  white-space: nowrap;
}
.off {
  background: var(--bp-tan);
  color: #3e2723;
}
</style>
