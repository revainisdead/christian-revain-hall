<template>
  <BoardPiece num="" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="" :dark="normalDark">
  </BoardPiece>
  <BoardPiece num="" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="" :dark="normalDark">
  </BoardPiece>
  <BoardPiece num="" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="" :dark="normalDark">
  </BoardPiece>
  <BoardPiece num="" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="" :dark="normalDark">
  </BoardPiece>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BoardPiece from 'components/BoardPiece.vue';

const normalDark = computed(() => {
  return props.flip ? false : true;
});

const normalLight = computed(() => {
  return props.flip ? true : false;
});

interface Props {
  flip: boolean;
}
const props = defineProps<Props>()
</script>

<style>
</style>
