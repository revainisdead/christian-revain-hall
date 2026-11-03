import { RouteRecordRaw } from 'vue-router';

// Routes need a logged-in user unless meta.public is set (see the guard in router/index.ts).
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('pages/LoginPage.vue'), meta: { public: true } },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'home', component: () => import('pages/IndexPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: { public: true },
  },
];

export default routes;
