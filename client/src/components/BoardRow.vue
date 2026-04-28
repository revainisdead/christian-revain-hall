<template>
  <BoardPiece num="1" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="2" :dark="normalDark">
  </BoardPiece>
  <BoardPiece num="3" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="4" :dark="normalDark">
  </BoardPiece>
  <BoardPiece num="5" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="6" :dark="normalDark">
  </BoardPiece>
  <BoardPiece num="7" :dark="normalLight">
  </BoardPiece>
  <BoardPiece num="8" :dark="normalDark">
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
