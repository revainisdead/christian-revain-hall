import { test, expect, Page } from '@playwright/test';
import { mockAuthApi } from './mockApi';
import { play, sq } from './play';

// Legal destinations for every position here were checked with python-chess.

const arrowsOf = async (page: Page): Promise<string[]> =>
  JSON.parse((await page.locator('canvas.chess-overlay').getAttribute('data-arrows')) ?? '[]');

async function expectArrows(page: Page, expected: string[]) {
  await expect.poll(() => arrowsOf(page)).toEqual([...expected].sort());
}

const targets = (page: Page) => page.locator('.move-target');
const marked = (page: Page) => page.locator('.capture-target');

test.beforeEach(async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
});

test('knight: one arrow per on-board jump, cleared on deselect', async ({ page }) => {
  await page.locator(sq('b1')).click();
  await expectArrows(page, ['b1-a3-preview', 'b1-c3-preview']); // a3, c3 only; d2 is own pawn
  await expect(targets(page)).toHaveCount(2);

  await page.locator(sq('b1')).click(); // deselect
  await expectArrows(page, []);
  await expect(targets(page)).toHaveCount(0);
});

test('pawn push is one arrow to the farthest square', async ({ page }) => {
  await page.locator(sq('e2')).click();
  await expectArrows(page, ['e2-e4-preview']);
  await expect(targets(page)).toHaveCount(2); // e3, e4
});

test('rook ray stops at the first enemy, which is marked for destruction', async ({ page }) => {
  await play(page, 'a2a4 b7b5 a4b5 h7h6');
  await page.locator(sq('a1')).click();
  await expectArrows(page, ['a1-a7-preview']); // a2..a7, not a8 behind the pawn
  await expect(targets(page)).toHaveCount(5); // a2..a6
  await expect(marked(page)).toHaveCount(1);
  await expect(page.locator(sq('a7'))).toHaveClass(/capture-target/);
});

test('bishop diagonal ends on a capture', async ({ page }) => {
  await play(page, 'e2e4 a7a6');
  await page.locator(sq('f1')).click();
  await expectArrows(page, ['f1-a6-preview']);
  await expect(page.locator(sq('a6'))).toHaveClass(/capture-target/);
});

test('queen: one arrow per direction, three enemies marked', async ({ page }) => {
  await play(page, 'e2e4 e7e5 d1h5 b8c6');
  await page.locator(sq('h5')).click();
  await expectArrows(page, [
    'h5-d1-preview',
    'h5-e5-preview',
    'h5-f7-preview',
    'h5-h3-preview',
    'h5-h7-preview',
  ]);
  await expect(marked(page)).toHaveCount(3);
  await Promise.all(
    ['e5', 'f7', 'h7'].map((victim) =>
      expect(page.locator(sq(victim))).toHaveClass(/capture-target/)
    )
  );
});

test('en passant marks the pawn that would be removed, not the empty target', async ({ page }) => {
  await play(page, 'e2e4 a7a6 e4e5 d7d5');
  await page.locator(sq('e5')).click();
  await expect(page.locator(sq('d5'))).toHaveClass(/capture-target/);
  await expect(page.locator(sq('d6'))).toHaveClass(/move-target/);
  await expect(page.locator(sq('e6'))).toHaveClass(/move-target/);
});

test('stepping back through history clears the preview', async ({ page }) => {
  await play(page, 'e2e4 e7e5');
  await page.locator(sq('g1')).click();
  await expectArrows(page, ['g1-e2-preview', 'g1-f3-preview', 'g1-h3-preview']);
  await page.keyboard.press('ArrowLeft');
  await expectArrows(page, []);
});
