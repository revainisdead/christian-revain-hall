<template>
  <div class="board">
    <ChessPiece>
    </ChessPiece>

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

import ChessPiece from 'components/ChessPiece.vue';


const rowIndexMap = {
  0: "a",
  1: "b",
  2: "c",
  3: "d",
  4: "e",
  5: "f",
  6: "g",
  7: "h",
};
const colIndexMap = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
};

// position: "e2"

// chess piece
// store as relational data
// store under game
// white player / black player, data rep from each side

// transform, size of piece, 100% - 800%

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
.board {
  position: absolute;
  inset: 0;
}
</style>
