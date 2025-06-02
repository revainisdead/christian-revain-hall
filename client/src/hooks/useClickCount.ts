import {
  computed,
  ref,
} from 'vue';


// ref example
export function useClickCount() {
  const clickCount = ref(0);

  const clickCountIncrement = () => {
    clickCount.value += 1
    return clickCount.value;
  }
  const clickCountDecrement = () => {
    clickCount.value += 1
    return clickCount.value;
  }

  return { clickCount, clickCountIncrement, clickCountDecrement };
}

// computed example
export function useDisplayTodo(todos: Ref<Todo[]>) {
  const activeTodos = computed(() =>
    todos.value.filter(todo => !todo.completed)
  );

  const completedTodos = computed(() =>
    todos.value.filter(todo => todo.completed)
  );

  // Naturally created after active todos, todos are unfinished
  const todoCount = computed(() => activeTodos.value.length);

  function displayTodoMarkComplete(todo: Todo) {
    const target = todos.value.find(t => t.id === todo.id);
    if (target) {
      target.completed = true;
    }
  }

  function displayTodoMarkUncomplete(todo: Todo) {
    const target = todos.value.find(t => t.id === todo.id);
    if (target) {
      target.completed = false;
    }
  }

  return {
    todoCount,
    activeTodos,
    completedTodos,
    displayTodoMarkComplete,
    displayTodoMarkUncomplete,
  };
}
