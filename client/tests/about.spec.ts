import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';

test('the drawer links to About, which ends with the fair-play policy', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
  await expect(page.getByText('Essential Links')).toHaveCount(0);

  await page.getByTestId('about-link').click();
  const policy = page.getByTestId('fair-play-policy');
  await expect(policy).toContainText('Fair Play and Acceptable Use Policy');
  await expect(policy).toContainText('are not liable for any misuse of BlunderProof');
});

test('About is readable without signing in', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: false });
  await page.goto('/#/about');
  await expect(page.getByTestId('fair-play-policy')).toBeVisible();
  await expect(page).not.toHaveURL(/login/);
});
