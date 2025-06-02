<template>
  <q-page class="row items-center justify-evenly">
    <example-component
      title="Example component"
      active="false"
      :todos="todos"
      :meta="{ ...meta }"
    ></example-component>
  </q-page>
</template>

<script lang="ts">
import { Todo, Meta } from 'components/models';
import ExampleComponent from 'components/ExampleComponent.vue';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { ExampleComponent },
  setup () {
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
    return { todos, meta };
  },
});
</script>
