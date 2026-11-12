<template>
  <!-- Shown after login until the user accepts the current fair-play policy (router guard). -->
  <q-page class="accept-page flex flex-center q-pa-md">
    <q-card class="accept-card">
      <q-card-section>
        <div class="text-h6">Before you start</div>
        <div class="text-caption text-grey-7">
          Read the fair-play policy to the end, then accept it to use BlunderProof.
        </div>
      </q-card-section>

      <q-separator />

      <div ref="scroller" class="policy-scroll q-pa-md" data-testid="policy-scroll" @scroll="onScroll">
        <FairPlayPolicy />
      </div>

      <q-separator />

      <q-card-section class="row items-center justify-between">
        <span class="text-caption text-grey-7" data-testid="scroll-hint">
          {{ readToEnd ? 'Thanks for reading.' : 'Scroll to the end to continue.' }}
        </span>
        <div class="row q-gutter-sm">
          <q-btn flat label="Log out" @click="logout" />
          <q-btn
            color="primary"
            label="I have read and accept"
            data-testid="accept-fair-play"
            :disable="!readToEnd"
            :loading="saving"
            @click="accept"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FairPlayPolicy from 'components/FairPlayPolicy.vue';
import { useAuthStore } from 'stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const scroller = ref<HTMLElement | null>(null);
const readToEnd = ref(false);
const saving = ref(false);

/** Within a few pixels of the bottom counts as read (rounding differs between browsers). */
function onScroll() {
  const el = scroller.value;
  if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
    readToEnd.value = true;
  }
}

// On a tall screen the whole policy may fit without scrolling: that's read too.
onMounted(() => nextTick(onScroll));

async function accept() {
  saving.value = true;
  try {
    await auth.acceptFairPlay();
    const next = typeof route.query.next === 'string' ? route.query.next : '/';
    await router.replace(next);
  } finally {
    saving.value = false;
  }
}

async function logout() {
  await auth.logout();
  await router.replace({ name: 'login' });
}
</script>

<style scoped>
.accept-page {
  background: var(--bp-page-bg);
}
.accept-card {
  width: min(720px, 100%);
}
.policy-scroll {
  max-height: 55vh;
  overflow-y: auto;
  font-size: 0.9rem;
}
</style>
