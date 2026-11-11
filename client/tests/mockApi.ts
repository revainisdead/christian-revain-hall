import { BrowserContext, Page } from '@playwright/test';

export const USER = { id: 1, username: 'christian', email: 'christian@example.com' };

/** Stub the auth API so UI tests run without a Django backend (CI serves only dist/spa). */
export async function mockAuthApi(
  page: Page | BrowserContext, // a context also covers tabs the page opens
  { loggedIn, googleClientId = null }: { loggedIn: boolean; googleClientId?: string | null },
) {
  let session = loggedIn;
  await page.route('**/api/auth/me/', (route) =>
    session
      ? route.fulfill({ json: USER })
      : route.fulfill({ status: 401, json: { detail: 'Authentication credentials were not provided.' } }),
  );
  await page.route('**/api/auth/config/', (route) =>
    route.fulfill({ json: { password_login: true, google_client_id: googleClientId } }),
  );
  await page.route('**/api/auth/csrf/', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/auth/login/', async (route) => {
    const body = route.request().postDataJSON();
    if (body.password === 'right-password') {
      session = true;
      await route.fulfill({ json: USER });
    } else {
      await route.fulfill({ status: 400, json: { detail: 'Invalid username or password.' } });
    }
  });
  await page.route('**/api/auth/logout/', async (route) => {
    session = false;
    await route.fulfill({ status: 204 });
  });
}
