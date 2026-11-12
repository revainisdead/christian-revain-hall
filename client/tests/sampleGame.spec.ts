import { test, expect } from '@playwright/test';
import { mockAuthApi } from './mockApi';
import { play, sq } from './play';
import sampleGame from '../src/samples/sample-game.json';

// The sample game (moves, loaded FEN, only mate) was checked with python-chess.
// e2e builds run with ENABLE_SAMPLE_GAME_LOAD=false, so this replays it by clicking every move.

test.beforeEach(async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true });
  await page.goto('/');
});

test('sample game: replay a full game by clicks, then White mates', async ({ page }) => {
  await play(page, sampleGame.moves);

  // One move from the end: White to move, game still open, queenside castle and sacrifices played.
  const moveList = page.getByTestId('move-list');
  await expect(page.getByTestId('side-to-move')).toHaveText('White to move');
  await expect(moveList).toContainText('12. O-O-O');
  await expect(moveList).toContainText('16. Qb8+');
  await expect(moveList).toContainText('16... Nxb8');
  await expect(page.locator(`${sq('c1')} img`)).toHaveAttribute('alt', 'w_king');
  await expect(page.getByTestId('game-result')).toHaveCount(0);

  const { uci, san } = sampleGame.finalMove;
  await play(page, [uci]);

  await expect(moveList).toContainText(`17. ${san}`);
  await expect(page.getByTestId('game-result')).toHaveText('Checkmate: White wins (1-0)');
  await expect(page.getByTestId('side-to-move')).toHaveText('Game over');
  await expect(page.locator(sq('e8'))).toHaveClass(/in-check/);

  // Navigating back still works after the game ends.
  await page.getByTestId('move-back').click();
  await expect(page.getByTestId('side-to-move')).toHaveText('White to move');
});
