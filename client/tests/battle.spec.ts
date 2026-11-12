import { test, expect, Page } from '@playwright/test';
import { mockAuthApi } from './mockApi';
import { play, sq } from './play';

// Attackers and defenders in these positions were listed with python-chess; each battle below
// is those captures, cheapest piece first, stopping when the next one wouldn't pay.

test.beforeEach(async ({ page }) => {
  await mockAuthApi(page.context(), { loggedIn: true }); // the context covers the new tab too
  await page.goto('/');
});

/** Click the eye button on a threat row and return the battle tab it opens. */
async function openBattle(page: Page, square: string): Promise<Page> {
  const row = page.locator(`[data-testid="threat-row"][data-threat-square="${square}"]`);
  const [tab] = await Promise.all([
    page.context().waitForEvent('page'),
    row.getByTestId('battle-preview').click(),
  ]);
  await tab.waitForLoadState();
  await expect(tab.getByTestId('battle-board')).toBeVisible();
  return tab;
}

const pieceOn = (tab: Page, square: string) => tab.locator(`${sq(square)} img`);

test('hanging bishop: the tab shows the pawn on f4 and no controls', async ({ page }) => {
  await play(page, 'd2d4 e7e5 d4e5 b8c6 g1f3 d8e7 c1f4 g7g5');
  const tab = await openBattle(page, 'f4');

  await expect(pieceOn(tab, 'f4')).toHaveAttribute('alt', 'b_pawn'); // g5xf4, nothing takes back
  await expect(pieceOn(tab, 'g5')).toHaveCount(0);
  await expect(tab.locator(sq('f4'))).toHaveClass(/selected/);
  await expect(tab.locator('button')).toHaveCount(0);

  // The game tab is untouched.
  await expect(page.locator(`${sq('f4')} img`)).toHaveAttribute('alt', 'w_bishop');
  await expect(page.getByTestId('move-list')).toContainText('4. Bf4');
  await expect(page.getByTestId('move-list')).toContainText('4... g5');
});

test('knight for a pawn: b4xc3, b2xc3', async ({ page }) => {
  await play(page, 'b1c3 b7b5 e2e3 b5b4');
  const tab = await openBattle(page, 'c3');

  await expect(pieceOn(tab, 'c3')).toHaveAttribute('alt', 'w_pawn');
  await expect(pieceOn(tab, 'b4')).toHaveCount(0);
  await expect(pieceOn(tab, 'b2')).toHaveCount(0);
  await expect(pieceOn(tab, 'd2')).toHaveAttribute('alt', 'w_pawn'); // not needed
});

test('a piece that holds: Nc6xe5, Nf3xe5, and the queen stays home', async ({ page }) => {
  await play(page, 'd2d4 e7e5 d4e5 b8c6 g1f3 d8e7 c1f4 g7g5');
  const tab = await openBattle(page, 'e5');

  await expect(pieceOn(tab, 'e5')).toHaveAttribute('alt', 'w_knight');
  await expect(pieceOn(tab, 'c6')).toHaveCount(0);
  await expect(pieceOn(tab, 'f3')).toHaveCount(0);
  await expect(pieceOn(tab, 'e7')).toHaveAttribute('alt', 'b_queen');
  await expect(pieceOn(tab, 'f4')).toHaveAttribute('alt', 'w_bishop');
});

test('a bad board in the address shows a message, not a broken board', async ({ page }) => {
  const tab = await page.context().newPage(); // a fresh tab, as the eye button opens
  await tab.goto('/#/battle?board=not-a-board');
  await expect(tab.getByTestId('battle-missing')).toBeVisible();
});
