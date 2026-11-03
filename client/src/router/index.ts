import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { useAuthStore } from 'stores/auth';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Send logged-out users to /login (and logged-in users away from it).
  Router.beforeEach(async (to) => {
    // Pass Quasar's Pinia explicitly (quasar.config sourceFiles.store); guards can run before it's active.
    const auth = useAuthStore(store);
    if (!auth.checked) {
      await auth.fetchMe();
    }
    if (to.meta.public) {
      return to.name === 'login' && auth.isLoggedIn ? { name: 'home' } : true;
    }
    return auth.isLoggedIn ? true : { name: 'login', query: { next: to.fullPath } };
  });

  return Router;
});
