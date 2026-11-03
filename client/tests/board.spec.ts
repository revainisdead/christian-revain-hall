import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';

test('board renders the starting position', async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');

  await expect(page).toHaveTitle(/BlunderProof/);
  await expect(page.locator('.board-square')).toHaveCount(64);
  await expect(page.locator('img.chess-piece')).toHaveCount(32);

  // a1 is dark, h1 is light; kings and queens on their home squares.
  await expect(page.locator('[data-square="a1"]')).toHaveClass(/dark/);
  await expect(page.locator('[data-square="h1"]')).toHaveClass(/light/);
  await expect(page.locator('[data-square="e1"] img')).toHaveAttribute('alt', 'w_king');
  await expect(page.locator('[data-square="d8"] img')).toHaveAttribute('alt', 'b_queen');
});
