<template>
  <div class="board-container">
    <div class="row row1">
      <BoardPiece num="11" :dark="false">
      </BoardPiece>
      <BoardPiece num="12" :dark="true">
      </BoardPiece>
      <BoardPiece num="13" :dark="false">
      </BoardPiece>
      <BoardPiece num="14" :dark="true">
      </BoardPiece>
      <BoardPiece num="15" :dark="false">
      </BoardPiece>
      <BoardPiece num="16" :dark="true">
      </BoardPiece>
      <BoardPiece num="17" :dark="false">
      </BoardPiece>
      <BoardPiece num="18" :dark="true">
      </BoardPiece>
    </div>
    <div class="row row2">
      <BoardPiece num="21" :dark="true">
      </BoardPiece>
      <BoardPiece num="22" :dark="false">
      </BoardPiece>
      <BoardPiece num="23" :dark="true">
      </BoardPiece>
      <BoardPiece num="24" :dark="false">
      </BoardPiece>
      <BoardPiece num="25" :dark="true">
      </BoardPiece>
      <BoardPiece num="26" :dark="false">
      </BoardPiece>
      <BoardPiece num="27" :dark="true">
      </BoardPiece>
      <BoardPiece num="28" :dark="false">
      </BoardPiece>
    </div>
    <div class="row row3">
      <BoardRow :flip="false"></BoardRow>
    </div>
    <div class="row row4">
      <BoardRow :flip="true"></BoardRow>
    </div>
    <div class="row row5">
      <BoardRow :flip="false"></BoardRow>
    </div>
    <div class="row row6">
      <BoardRow :flip="true"></BoardRow>
    </div>
    <div class="row row7">
      <BoardRow :flip="false"></BoardRow>
    </div>
    <div class="row row8">
      <BoardRow :flip="true"></BoardRow>
    </div>
  </div>

</template>

<script lang="ts" setup>
import { ref } from 'vue';

import BoardPiece from 'components/BoardPiece.vue';
import BoardRow from 'components/BoardRow.vue';

const test = ref(1);

interface Props {
  title: string;
  optional?: boolean;
};
const props = defineProps<Props>()

//const props = toRefs(props)

console.log('props test', props)
console.log(test)

</script>

<style>
.board-container {
  width: 400px;
  height: 400px;
  border: 2px solid black;
}
</style>
