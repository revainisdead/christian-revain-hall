import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from 'boot/axios';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthConfig {
  password_login: boolean; // dev-only username/password login
  google_client_id: string | null; // null = Google sign-in not configured
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const checked = ref(false); // has /auth/me/ been asked this page load?
  const config = ref<AuthConfig | null>(null);
  const isLoggedIn = computed(() => user.value !== null);

  async function fetchMe() {
    try {
      user.value = (await api.get<User>('/auth/me/')).data;
    } catch {
      user.value = null;
    } finally {
      checked.value = true;
    }
    return user.value;
  }

  async function loadConfig() {
    if (!config.value) {
      config.value = (await api.get<AuthConfig>('/auth/config/')).data;
    }
    return config.value;
  }

  // Sets the csrftoken cookie; axios echoes it back as X-CSRFToken on POSTs.
  async function ensureCsrf() {
    await api.get('/auth/csrf/');
  }

  async function login(username: string, password: string) {
    await ensureCsrf();
    user.value = (await api.post<User>('/auth/login/', { username, password })).data;
  }

  async function googleLogin(credential: string) {
    await ensureCsrf();
    user.value = (await api.post<User>('/auth/google/', { credential })).data;
  }

  async function logout() {
    await ensureCsrf();
    await api.post('/auth/logout/');
    user.value = null;
  }

  return { user, checked, config, isLoggedIn, fetchMe, loadConfig, login, googleLogin, logout };
});
