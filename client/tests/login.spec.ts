import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';

test('logged-out users are sent to the login page with both boxes', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: false });
  await page.goto('/');

  await expect(page).toHaveURL(/#\/login/);
  await expect(page.getByTestId('dev-login')).toBeVisible();
  await expect(page.getByTestId('google-login')).toBeVisible();
  await expect(page.getByTestId('google-login')).toContainText('GOOGLE_CLIENT_ID');
});

test('dev login, then logout', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: false });
  await page.goto('/#/login');

  await page.getByLabel('Username').fill('christian');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');

  await page.getByLabel('Password').fill('right-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('current-user')).toHaveText('christian');
  await expect(page.locator('img.chess-piece')).toHaveCount(32);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/#\/login/);
});
