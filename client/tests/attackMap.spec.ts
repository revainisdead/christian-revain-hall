import { test, expect, Page } from '@playwright/test';
import { mockAuthApi } from './mockApi';
import { play, sq } from './play';

// Every count and exchange result here was computed with python-chess (board.attackers, plus a
// Python copy of the exchange rule), not worked out by hand.

const counts = (page: Page, square: string) => {
  const el = page.locator(sq(square));
  return Promise.all([
    el.getAttribute('data-attackers-mine'),
    el.getAttribute('data-attackers-theirs'),
  ]);
};

async function expectCounts(page: Page, square: string, mine: number | null, theirs: number | null) {
  const want = [mine, theirs].map((n) => (n === null ? null : String(n)));
  await expect.poll(() => counts(page, square)).toEqual(want);
}

async function pick(page: Page, testId: string, option: string) {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: option }).click();
}

const rows = (page: Page) => page.getByTestId('threat-row');

async function expectThreats(page: Page, expected: [string, string, number][]) {
  await expect(rows(page)).toHaveCount(expected.length);
  await Promise.all(
    expected.map(async ([square, versus, loss], i) => {
      const row = rows(page).nth(i);
      await expect(row).toHaveAttribute('data-threat-square', square);
      await expect(row).toHaveAttribute('data-loss', String(loss));
      await expect(row.locator('.count-cell')).toHaveText(versus);
    })
  );
}

test.beforeEach(async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
});

test('starting position: green and red counts per square', async ({ page }) => {
  await expectCounts(page, 'f3', 3, 0);
  await expectCounts(page, 'e2', 4, 0);
  await expectCounts(page, 'c6', 0, 3);
  await expect(page.locator(`${sq('f3')} .attack-count.mine`)).toHaveText('3');
  await expect(page.locator(`${sq('f3')} .attack-count.theirs`)).toHaveCount(0); // zero is hidden
  await expect(page.locator(`${sq('c6')} .attack-count.theirs`)).toHaveText('3');
  await expect(page.getByTestId('threat-empty')).toBeVisible();
});

test('the dropdown switches to pieces only, then off', async ({ page }) => {
  await pick(page, 'attack-mode', 'Pieces only');
  await expectCounts(page, 'f3', null, null); // empty square
  await expectCounts(page, 'd1', 1, 0);

  await pick(page, 'attack-mode', 'Off');
  await expectCounts(page, 'd1', null, null);
  await expect(page.locator('.attack-count')).toHaveCount(0);
});

test('viewing as Black swaps green and red', async ({ page }) => {
  await pick(page, 'attack-view-as', 'Black');
  await expectCounts(page, 'c6', 3, 0);
  await expectCounts(page, 'f3', 0, 3);
});

test('an undefended pawn is losing -1', async ({ page }) => {
  await play(page, 'e2e4 e7e5 g1f3'); // Black to move: e5 attacked by Nf3
  await expectThreats(page, [['e5', '1 vs 0', 1]]);
  await expect(rows(page).first()).toContainText('Losing −1');
});

test('the hanging queen is listed before the pawn', async ({ page }) => {
  await play(page, 'e2e4 e7e5 d1h5 g8f6');
  await expectThreats(page, [
    ['h5', '1 vs 0', 9],
    ['e4', '1 vs 0', 1],
  ]);
});

test('defended twice still loses to a pawn attack', async ({ page }) => {
  await play(page, 'b1c3 b7b5 e2e3 b5b4');
  await expectThreats(page, [['c3', '1 vs 2', 2]]);
});

test('an even fight holds, a hanging bishop does not', async ({ page }) => {
  await play(page, 'd2d4 e7e5 d4e5 b8c6 g1f3 d8e7 c1f4 g7g5');
  await expectThreats(page, [
    ['f4', '1 vs 0', 3],
    ['e5', '2 vs 2', 0],
  ]);
  await expect(rows(page).nth(1)).toContainText('Holds');
});
