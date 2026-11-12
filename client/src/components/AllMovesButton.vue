<template>
  <!-- Experimental: every piece's moves at once (white and black arrows). -->
  <q-btn
    round
    unelevated
    icon="open_with"
    :color="modelValue ? 'primary' : undefined"
    :class="{ off: !modelValue }"
    aria-label="All moves"
    data-testid="all-moves"
    :aria-pressed="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <q-tooltip anchor="center right" self="center left">All moves</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', on: boolean): void }>();
</script>

<style scoped>
.off {
  background: var(--bp-tan);
  color: #3e2723;
}
</style>
