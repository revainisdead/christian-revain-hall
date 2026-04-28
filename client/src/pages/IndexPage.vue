<template>
  <q-page class="row items-center justify-evenly">
    <div class="board-container">
      <ChessBoard>
      </ChessBoard>

      <ChessOverlay>
      </ChessOverlay>
    </div>

    { todos }

    Count: { meta }
  </q-page>
</template>

<script setup lang="ts">
import { Todo, Meta } from 'components/models';
//import ExampleComponent from 'components/ExampleComponent.vue';
import { ref } from 'vue';

import ChessBoard from 'components/ChessBoard.vue';
import ChessOverlay from 'components/ChessOverlay.vue';

const todos = ref<Todo[]>([
  {
    id: 1,
    content: 'ct1',
    completed: true,
  },
  {
    id: 2,
    content: 'ct2',
    completed: true,
  },
  {
    id: 3,
    content: 'ct3',
    completed: true,
  },
  {
    id: 4,
    content: 'ct4',
    completed: false,
  },
  {
    id: 5,
    content: 'ct5',
    completed: false,
  },
]);
const meta = ref<Meta>({
  totalCount: 1200,
});
</script>


<style>
.board-container {
  position: relative;
  width: 400px;
  height: 400px;
  border: 2px solid black;
}

</style>
