import { defineStore } from 'pinia';

/**
 * Board group: state for the local board and its training tools that has to outlive one
 * component (the game, layer settings, what the battle tab shows). Empty for now; see
 * ../CONTEXT.md for what belongs here and what doesn't.
 */
export const useBoardStore = defineStore('board', {
  state: () => ({}),
});
