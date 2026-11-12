import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';
import { play, sq } from './play';
import sampleGame from '../src/samples/sample-game.json';

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
  await expect(page.getByTestId('move-list')).toContainText('1. e4');

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

// The Arrows (testing) card is hidden for now (commented out in IndexPage.vue); unskip with it.
test.skip('arrow controls draw and clear arrows', async ({ page }) => {
  const overlay = page.locator('canvas.chess-overlay');
  await expect(overlay).toHaveAttribute('data-arrow-count', '0');

  await page.getByTestId('arrow-draw').click(); // default e2 -> e4
  await expect(overlay).toHaveAttribute('data-arrow-count', '1');
  await page.getByRole('button', { name: 'Sample set' }).click();
  await expect(overlay).toHaveAttribute('data-arrow-count', '4');

  await page.getByTestId('arrow-clear').click();
  await expect(overlay).toHaveAttribute('data-arrow-count', '0');
});

test('move list: one column, about five lines tall, current move kept in view', async ({
  page,
}) => {
  // The first 8 moves of the sample game (checked with python-chess).
  await play(page, sampleGame.moves.slice(0, 16));

  const list = page.getByTestId('move-list');
  const rows = page.getByTestId('move-row');
  await expect(rows).toHaveCount(16);
  await expect(rows.nth(0)).toHaveText('1. e4');
  await expect(rows.nth(1)).toHaveText('1... e5');
  await expect(rows.nth(14)).toHaveText('8. Nc3');
  await expect(rows.nth(15)).toHaveText('8... c6');

  const inView = (i: number) =>
    list.evaluate((box, n) => {
      const row = box.querySelectorAll<HTMLElement>('[data-testid="move-row"]')[n];
      return (
        row.offsetTop >= box.scrollTop &&
        row.offsetTop + row.offsetHeight <= box.scrollTop + box.clientHeight
      );
    }, i);

  // Capped height: it scrolls, the newest move is visible and the first one isn't.
  expect(await list.evaluate((box) => box.scrollHeight > box.clientHeight)).toBe(true);
  await expect.poll(() => inView(15)).toBe(true);
  expect(await inView(0)).toBe(false);

  // Jumping to the start scrolls back up.
  await page.keyboard.press('Home');
  await expect.poll(() => inView(0)).toBe(true);
});

test('player bars: "White Player" / "Black Player", "to move" on the side to move', async ({
  page,
}) => {
  const white = page.getByTestId('player-w');
  const black = page.getByTestId('player-b');
  await expect(white).toHaveText(/^White Player\s*to move$/);
  await expect(black).toHaveText('Black Player');

  await play(page, 'e2e4');
  await expect(white).toHaveText('White Player');
  await expect(black).toHaveText(/^Black Player\s*to move$/);
});

test('layout: equal left cards squared with the board, All moves in the controls panel', async ({
  page,
}) => {
  const box = async (id: string) => (await page.getByTestId(id).boundingBox())!;
  const threats = await box('threat-list');
  const moves = await box('chess-controls');
  const white = await box('player-w');

  expect(Math.abs(threats.height - moves.height)).toBeLessThan(2);
  expect(Math.abs(threats.width - moves.width)).toBeLessThan(2);
  expect(Math.abs(moves.y + moves.height - (white.y + white.height))).toBeLessThan(2); // bottoms align

  const panel = page.getByTestId('controls-panel');
  await expect(panel.getByTestId('all-moves')).toHaveAttribute('aria-label', 'All moves');
});
