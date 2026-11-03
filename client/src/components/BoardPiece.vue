<template>
  <div
    class="board-square"
    :class="dark ? 'dark' : 'light'"
    :data-square="name"
    :style="{ backgroundImage: `url('${squareImage(dark)}')` }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { squareImage } from 'components/chessAssets';

interface Props {
  name: string;
  dark: boolean;
}
defineProps<Props>();
</script>

<style>
.board-square {
  position: relative;
  background-size: cover;
}
</style>
