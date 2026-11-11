import { Page } from '@playwright/test';

/** CSS selector for a board square, e.g. sq('e4'). */
export const sq = (name: string) => `[data-square="${name}"]`;

/** Play one UCI move by clicking from/to squares; a 5th char picks the promotion piece. */
async function playMove(page: Page, uci: string) {
  await page.locator(sq(uci.slice(0, 2))).click();
  await page.locator(sq(uci.slice(2, 4))).click();
  if (uci.length === 5) {
    await page.getByTestId(`promote-${uci[4]}`).click();
  }
}

/**
 * Play UCI moves in order (a space-separated string or a list).
 * Moves must run one after another, so this chains promises with reduce:
 * forEach/map would start every click at once.
 */
export function play(page: Page, uciMoves: string | string[]): Promise<void> {
  const moves = typeof uciMoves === 'string' ? uciMoves.split(' ') : uciMoves;
  return moves.reduce<Promise<void>>(
    (previous, uci) => previous.then(() => playMove(page, uci)),
    Promise.resolve()
  );
}
