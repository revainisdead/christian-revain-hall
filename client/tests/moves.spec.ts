import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';

const sq = (name: string) => `[data-square="${name}"]`;

test.beforeEach(async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
});

test('click-to-move plays e2-e4, then back and forward step through it', async ({ page }) => {
  const sideToMove = page.getByTestId('side-to-move');
  await expect(sideToMove).toHaveText('White to move');

  await page.locator(sq('e2')).click();
  await expect(page.locator(sq('e2'))).toHaveClass(/selected/);
  await page.locator(sq('e4')).click();

  await expect(page.locator(`${sq('e4')} img`)).toHaveAttribute('alt', 'w_pawn');
  await expect(page.locator(`${sq('e2')} img`)).toHaveCount(0);
  await expect(sideToMove).toHaveText('Black to move');
  await expect(page.getByTestId('player-b')).toHaveClass(/active/);
  await expect(page.getByTestId('player-w')).not.toHaveClass(/active/);
  await expect(page.getByTestId('move-list')).toContainText('1. e2-e4');

  await page.getByTestId('move-back').click();
  await expect(page.locator(`${sq('e2')} img`)).toHaveAttribute('alt', 'w_pawn');
  await expect(page.locator(`${sq('e4')} img`)).toHaveCount(0);
  await expect(sideToMove).toHaveText('White to move');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator(`${sq('e4')} img`)).toHaveAttribute('alt', 'w_pawn');
});

test('only the side to move can be selected', async ({ page }) => {
  await page.locator(sq('e7')).click();
  await expect(page.locator(sq('e7'))).not.toHaveClass(/selected/);
});

test('arrow controls draw and clear arrows', async ({ page }) => {
  const overlay = page.locator('canvas.chess-overlay');
  await expect(overlay).toHaveAttribute('data-arrow-count', '0');

  await page.getByTestId('arrow-draw').click(); // default e2 -> e4
  await expect(overlay).toHaveAttribute('data-arrow-count', '1');
  await page.getByRole('button', { name: 'Sample set' }).click();
  await expect(overlay).toHaveAttribute('data-arrow-count', '4');

  await page.getByTestId('arrow-clear').click();
  await expect(overlay).toHaveAttribute('data-arrow-count', '0');
});
