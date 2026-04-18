<template>
  <div
    class="board-piece"
    :class="{ num: props.num, dark: isDarkSquare, light: !isDarkSquare }">
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    num: number;
    dark: boolean;
  }

  const props = defineProps<Props>()

  const isDarkSquare = computed(() => {
    return props.dark === true;
  });

  console.log('board piece props test:', props)
</script>

<style>
.board-piece {
  width: 49px;
  height: 49px;
  position: relative;
  display: inline-block;

  margin: 0 0 0 0;
}
.board-piece.light {
  background-color: #ad926c;
}
.board-piece.dark {
  background-color: #452800;
}
</style>
