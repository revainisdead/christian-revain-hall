<template>
  <!-- Playing from an earlier position drops the later moves -->
  <q-dialog v-model="open" @hide="settle(false)">
    <q-card data-testid="truncate-confirm">
      <q-card-section>
        Play from here? This discards the {{ laterMoves }} later
        {{ laterMoves === 1 ? 'move' : 'moves' }}.
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="settle(false)" />
        <q-btn
          flat
          color="negative"
          label="Discard and play"
          data-testid="truncate-ok"
          @click="settle(true)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ laterMoves: number }>();

// Promise-backed: ask() opens the dialog and resolves once with the answer (closing = false).
const open = ref(false);
let resolver: ((ok: boolean) => void) | null = null;

function ask(): Promise<boolean> {
  open.value = true;
  return new Promise((resolve) => (resolver = resolve));
}
function settle(ok: boolean) {
  resolver?.(ok);
  resolver = null;
  open.value = false;
}

defineExpose({ ask, open });
</script>
