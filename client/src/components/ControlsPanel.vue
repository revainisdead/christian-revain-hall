<template>
  <!-- Slim vertical toolbar beside the board. Each control is an icon button with a tooltip. -->
  <q-card class="controls-panel-card column items-center q-py-sm" data-testid="controls-panel">
    <slot />
  </q-card>
</template>

<style scoped>
.controls-panel-card {
  width: 52px;
  gap: 6px;
  background: var(--bp-tan-light);
}
</style>
