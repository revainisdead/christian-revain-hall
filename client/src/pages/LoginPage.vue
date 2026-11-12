<template>
  <q-page class="login-page flex flex-center">
    <div class="column items-center q-gutter-y-lg">
      <h1 class="text-h4 q-my-none">
        <router-link :to="{ name: 'landing' }" class="home-link">BlunderProof</router-link>
      </h1>

      <div class="login-boxes">
        <!-- Local username/password login: development only (server: PASSWORD_LOGIN_ENABLED) -->
        <q-card
          v-if="config?.password_login"
          class="login-box"
          data-testid="dev-login"
          bordered
        >
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6">Local login</div>
              <q-badge color="orange" label="Development only" />
            </div>
          </q-card-section>

          <q-form class="q-px-md q-pb-md q-gutter-y-sm" @submit="submitPassword">
            <q-input
              v-model="username"
              label="Username"
              autocomplete="username"
              outlined
              dense
              autofocus
            />
            <q-input
              v-model="password"
              label="Password"
              type="password"
              autocomplete="current-password"
              outlined
              dense
            />
            <q-btn
              type="submit"
              label="Sign in"
              color="primary"
              class="full-width"
              :loading="busy"
              :disable="!username || !password"
            />
          </q-form>
        </q-card>

        <!-- Google Identity Services sign-in -->
        <q-card class="login-box" data-testid="google-login" bordered>
          <q-card-section>
            <div class="text-h6">Sign in with Google</div>
          </q-card-section>

          <q-card-section class="flex flex-center google-slot">
            <div v-if="config?.google_client_id" ref="googleButton" />
            <div v-else class="text-grey-7 text-center">
              Google sign-in isn't set up yet.<br>
              Add <code>GOOGLE_CLIENT_ID</code> to <code>.env</code>.
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="error" class="text-negative" role="alert">
        {{ error }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import { useAuthStore } from 'stores/auth';

interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleAccountsId {
  initialize(options: { client_id: string; callback: (r: GoogleCredentialResponse) => void }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const config = computed(() => auth.config);
const username = ref('');
const password = ref('');
const busy = ref(false);
const error = ref('');
const googleButton = ref<HTMLElement | null>(null);

function errorMessage(e: unknown): string {
  if (isAxiosError(e) && e.response?.data?.detail) {
    return String(e.response.data.detail);
  }
  return 'Sign-in failed. Please try again.';
}

async function finish(action: () => Promise<void>) {
  busy.value = true;
  error.value = '';
  try {
    await action();
    const next = typeof route.query.next === 'string' ? route.query.next : '/';
    await router.replace(next);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}

function submitPassword() {
  return finish(() => auth.login(username.value, password.value));
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(script);
  });
}

async function setUpGoogle(clientId: string) {
  try {
    await loadGoogleScript();
  } catch (e) {
    error.value = (e as Error).message;
    return;
  }
  await nextTick();
  if (!window.google || !googleButton.value) {
    return;
  }
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: ({ credential }) => finish(() => auth.googleLogin(credential)),
  });
  window.google.accounts.id.renderButton(googleButton.value, {
    theme: 'outline',
    size: 'large',
    width: 260,
  });
}

onMounted(async () => {
  try {
    const cfg = await auth.loadConfig();
    if (cfg.google_client_id) {
      await setUpGoogle(cfg.google_client_id);
    }
  } catch {
    error.value = 'Could not reach the server.';
  }
});
</script>

<style>
.login-page {
  background: #f4efe9;
}
.login-boxes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  padding: 0 16px;
}
.login-box {
  width: 320px;
  min-height: 280px;
}
.google-slot {
  min-height: 160px;
}
</style>

<style scoped>
.home-link {
  color: inherit;
  text-decoration: none;
}
</style>
