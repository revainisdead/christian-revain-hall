<template>
  <q-card bordered class="threat-list" data-testid="threat-list">
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1">Pieces under attack</div>
      <div class="text-caption text-grey-7">{{ sideName }}, most urgent first</div>
    </q-card-section>

    <q-card-section v-if="!threats.length" class="text-grey-7" data-testid="threat-empty">
      Nothing of yours is attacked.
    </q-card-section>

    <q-markup-table v-else flat dense class="q-mt-sm">
      <thead>
        <tr>
          <th class="text-left">Piece</th>
          <th title="Their attackers vs your defenders">Att vs Def</th>
          <th class="text-left">Battle</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="t in threats"
          :key="t.square"
          data-testid="threat-row"
          :data-threat-square="t.square"
          :data-loss="t.loss"
          :class="t.loss ? 'losing' : 'holding'"
        >
          <td class="text-left">
            <img :src="pieceImage(t.piece)" :alt="t.piece" class="threat-piece">
            {{ t.square }}
          </td>
          <td class="text-center count-cell">
            <span class="theirs">{{ t.attackers }}</span> vs
            <span class="mine">{{ t.defenders }}</span>
          </td>
          <td class="text-left battle">
            <template v-if="t.loss">Losing <b>−{{ t.loss }}</b></template>
            <template v-else>Holds</template>
          </td>
          <td class="text-right">
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="visibility"
              :aria-label="`Show the board after the battle on ${t.square}`"
              data-testid="battle-preview"
              @click="emit('preview', t.square)"
            >
              <q-tooltip>Board after the battle</q-tooltip>
            </q-btn>
          </td>
        </tr>
      </tbody>
    </q-markup-table>

    <q-card-section class="text-caption text-grey-7 q-pt-sm">
      Battle plays out the captures cheapest piece first. Pawn 1, knight and bishop 3, rook 5,
      queen 9. Pins and x-rays aren't counted yet.
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PieceColor, pieceImage } from 'components/chessAssets';
import { Threat } from 'components/attackMap';

const props = defineProps<{ threats: Threat[]; me: PieceColor }>();
const emit = defineEmits<{ (e: 'preview', square: string): void }>();
const sideName = computed(() => (props.me === 'w' ? 'White' : 'Black'));
</script>

<style scoped>
.threat-list {
  width: 290px;
  background: var(--bp-tan-light);
}
.threat-list .q-markup-table {
  background: transparent;
}
.threat-piece {
  width: 22px;
  height: 22px;
  vertical-align: middle;
}
.count-cell .theirs {
  color: #c62828;
  font-weight: 700;
}
.count-cell .mine {
  color: #2e7d32;
  font-weight: 700;
}
tr.losing .battle {
  color: #c62828;
}
tr.holding .battle {
  color: #2e7d32;
}
</style>
