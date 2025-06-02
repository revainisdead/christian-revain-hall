<template>
  <div>
    <p>{{ title }}</p>
    <ul>
      <li v-for="todo in todos" :key="todo.id" @click="clickCountIncrement">
        {{ todo.id }} - {{ todo.content }}
      </li>
    </ul>
    <p>Count: {{ todoCount }} / {{ meta.totalCount }}</p>
    <p>Active: {{ active ? 'yes' : 'no' }}</p>
    <p>Clicks on todos: {{ clickCount }}</p>



  </div>
</template>

<script lang="ts" setup>
import {
  PropType,
  toRefs,
} from 'vue';
import { Todo, Meta } from './models';

import { useClickCount } from '../hooks/useClickCount.ts';
import { useDisplayTodo } from '../hooks/useClickCount.ts';


// Note: To avoid needing to define the default
//       with a callback which is strange, simply
//       create a copy as you pass it into the child
//
//       Ex. `:meta="{ ...meta }"`
const props = defineProps({
  title: {
    type: String as PropType<string>,
    default: 'No Title Given',
  },
  count: {
    type: Number as PropType<number>,
    default: 0,
  },
  active: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  todos: {
    type: Array as PropType<Todo[]>,
    default: () => [],
  },
  meta: {
    type: Object as PropType<Meta>,
    default: () => ({ total_count: 0 }),
  }, 
})

const {
  title,
  todos,
  meta,
  active,
} = toRefs(props);

console.log('props:', props);
console.log('active:', active);

const { clickCount, clickCountIncrement, _clickCountDecrement } = useClickCount()
const { todoCount, _displayTodoMarkComplete, _displayTodoMarkUncomplete } = useDisplayTodo(todos.value)

</script>
