import { test, expect, Page } from '@playwright/test';
import { mockAuthApi } from './mockApi';
import { play, sq } from './play';

// Move sequences here were checked with python-chess (legal, and the expected SAN / result).

const pieceOn = (page: Page, square: string) => page.locator(`${sq(square)} img`);

test.beforeEach(async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
});

test('illegal target does not move the piece', async ({ page }) => {
  await page.locator(sq('e2')).click();
  await page.locator(sq('e5')).click();
  await expect(pieceOn(page, 'e2')).toHaveAttribute('alt', 'w_pawn');
  await expect(pieceOn(page, 'e5')).toHaveCount(0);
  await expect(page.getByTestId('side-to-move')).toHaveText('White to move');
});

test('castling moves king and rook', async ({ page }) => {
  await play(page, 'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 e1g1');
  await expect(pieceOn(page, 'g1')).toHaveAttribute('alt', 'w_king');
  await expect(pieceOn(page, 'f1')).toHaveAttribute('alt', 'w_rook');
  await expect(page.getByTestId('move-list')).toContainText('O-O');
});

test('en passant removes the captured pawn', async ({ page }) => {
  await play(page, 'e2e4 a7a6 e4e5 d7d5 e5d6');
  await expect(pieceOn(page, 'd6')).toHaveAttribute('alt', 'w_pawn');
  await expect(pieceOn(page, 'd5')).toHaveCount(0);
  await expect(page.getByTestId('move-list')).toContainText('exd6');
});

test('promotion picker places the chosen piece', async ({ page }) => {
  await play(page, 'a2a4 b7b5 a4b5 a7a6 b5a6 c8b7 a6b7 h7h6 b7a8n');
  await expect(pieceOn(page, 'a8')).toHaveAttribute('alt', 'w_knight');
  await expect(page.getByTestId('move-list')).toContainText('bxa8=N');
});

test("fool's mate ends the game", async ({ page }) => {
  await play(page, 'f2f3 e7e5 g2g4 d8h4');
  await expect(page.getByTestId('game-result')).toHaveText('Checkmate: Black wins (0-1)');
  await expect(page.getByTestId('side-to-move')).toHaveText('Game over');
  await expect(page.locator(sq('e1'))).toHaveClass(/in-check/);
  // No more moves at the final position.
  await page.locator(sq('a2')).click();
  await expect(page.locator(sq('a2'))).not.toHaveClass(/selected/);
});

test('playing from an earlier position asks before discarding later moves', async ({ page }) => {
  await play(page, 'e2e4 e7e5');
  await page.getByTestId('move-back').click(); // back to after 1. e4

  await page.locator(sq('c7')).click();
  await page.locator(sq('c5')).click();
  await expect(page.getByTestId('truncate-confirm')).toBeVisible();
  await page.getByTestId('truncate-ok').click();

  await expect(pieceOn(page, 'c5')).toHaveAttribute('alt', 'b_pawn');
  await expect(page.getByTestId('move-list')).toContainText('c5');
  await expect(page.getByTestId('move-list')).not.toContainText('e5');
});
