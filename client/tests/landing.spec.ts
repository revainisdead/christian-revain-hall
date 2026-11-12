import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';

test('the front page pitches, prices and shows a non-interactive demo board', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: false });
  await page.goto('/');

  await expect(page.getByTestId('landing')).toContainText('See the battle before it happens.');
  await expect(page.getByTestId('pricing')).toContainText('$5');

  // Demo: 1. e4 e5 2. Qh5 Nc6 with the queen selected (checked with python-chess).
  const demo = page.getByTestId('demo-board');
  await expect(demo.locator('img.chess-piece')).toHaveCount(32);
  const arrows = JSON.parse((await demo.locator('canvas').getAttribute('data-arrows')) ?? '[]');
  expect(arrows).toEqual([
    'h5-d1-preview',
    'h5-e5-preview',
    'h5-f7-preview',
    'h5-h3-preview',
    'h5-h7-preview',
  ]);
  await expect(demo.locator('.capture-target')).toHaveCount(3);
  await expect(demo).toHaveCSS('pointer-events', 'none');

  await page.getByTestId('landing-cta').click();
  await expect(page).toHaveURL(/#\/login/);
});

test('signed-in users still open straight to the board', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
  await expect(page.getByTestId('board')).toBeVisible();
});
