import { Arrow, ArrowKind } from 'components/chessAssets';
import { PreviewMove } from 'components/useBoardHistory';

const fileOf = (square: string) => square.charCodeAt(0) - 97; // a = 0
const rankOf = (square: string) => parseInt(square[1], 10);

/**
 * Move-preview arrows for a piece on `from`, given its legal destinations.
 *
 * Destinations come from chess.js, so they are already on the board, stop at the first piece
 * in the way (an enemy is included as a capture, a friend is not), and respect pins and check.
 * Sliding moves are merged into one arrow per direction, to the farthest square: a rook on an
 * open file gets one arrow down the file, not seven stacked ones. Knight jumps aren't on a line,
 * so each gets its own (straight, for now; L-shaped arrows are later polish).
 */
export function previewArrows(
  from: string,
  moves: PreviewMove[],
  kind: ArrowKind = 'preview'
): Arrow[] {
  const farthest = new Map<string, { to: string; distance: number }>();
  const jumps: string[] = [];

  moves.forEach(({ to }) => {
    const dx = fileOf(to) - fileOf(from);
    const dy = rankOf(to) - rankOf(from);
    const straight = dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
    if (!straight) {
      jumps.push(to);
      return;
    }
    const direction = `${Math.sign(dx)},${Math.sign(dy)}`;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    const best = farthest.get(direction);
    if (!best || distance > best.distance) {
      farthest.set(direction, { to, distance });
    }
  });

  return [...[...farthest.values()].map((f) => f.to), ...jumps]
    .sort()
    .map((to) => ({ from, to, kind }));
}
