<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          BlunderProof
        </q-toolbar-title>

        <div v-if="auth.user" class="row items-center q-gutter-x-sm">
          <span data-testid="current-user">{{ auth.user.username }}</span>
          <q-btn
            flat
            dense
            icon="logout"
            label="Log out"
            @click="logout"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="200"
    >
      <q-list>
        <q-item clickable :to="{ name: 'home' }" exact>
          <q-item-section avatar><q-icon name="grid_on" /></q-item-section>
          <q-item-section>Board</q-item-section>
        </q-item>
      </q-list>
      <!-- Kept low-key at the bottom of the drawer: About holds credits and the fair-play policy. -->
      <q-list class="drawer-footer">
        <q-item clickable dense :to="{ name: 'about' }" data-testid="about-link">
          <q-item-section class="text-caption text-grey-7">About</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  await router.replace({ name: 'login' });
}

const leftDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>

<style scoped>
.drawer-footer {
  position: absolute;
  bottom: 8px;
  width: 100%;
}
</style>
