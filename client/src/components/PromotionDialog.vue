<template>
  <q-dialog v-model="open" @hide="settle(null)">
    <q-card data-testid="promotion-picker">
      <q-card-section class="text-subtitle1">Promote to</q-card-section>
      <q-card-section class="row q-gutter-sm">
        <q-btn
          v-for="role in PROMOTION_ROLES"
          :key="role.code"
          flat
          :data-testid="`promote-${role.code}`"
          :aria-label="role.name"
          @click="settle(role.code)"
        >
          <img :src="pieceImage(`${color}_${role.name}`)" :alt="role.name" class="promo-img">
        </q-btn>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PieceRole, pieceImage } from 'components/chessAssets';
import { PromotionRole } from 'components/useBoardHistory';

defineProps<{ color: 'w' | 'b' }>();

const PROMOTION_ROLES: { code: PromotionRole; name: PieceRole }[] = [
  { code: 'q', name: 'queen' },
  { code: 'r', name: 'rook' },
  { code: 'b', name: 'bishop' },
  { code: 'n', name: 'knight' },
];

// Promise-backed: ask() opens the dialog and resolves once with the choice (closing = null).
const open = ref(false);
let resolver: ((role: PromotionRole | null) => void) | null = null;

function ask(): Promise<PromotionRole | null> {
  open.value = true;
  return new Promise((resolve) => (resolver = resolve));
}
function settle(role: PromotionRole | null) {
  resolver?.(role);
  resolver = null;
  open.value = false;
}

defineExpose({ ask, open });
</script>

<style scoped>
.promo-img {
  width: 56px;
  height: 56px;
}
</style>
