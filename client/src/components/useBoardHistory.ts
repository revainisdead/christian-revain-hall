import { computed, ref } from 'vue';
import { Position, startingPosition } from 'components/chessAssets';

export interface PlayedMove {
  from: string;
  to: string;
}

/**
 * Step 1 board state: a list of positions plus a cursor (`ply`).
 *
 * No rules yet: any piece of the side to move can go to any square (a capture just replaces
 * what's there). Castling, en passant, promotion and legality arrive with chess.js (UI plan,
 * step 2). The interface here (positions, ply, move, back/forward) is what that step keeps.
 */
export function useBoardHistory(start: Position = startingPosition()) {
  const positions = ref<Position[]>([{ ...start }]);
  const moves = ref<PlayedMove[]>([]);
  const ply = ref(0); // index into positions; 0 = start position

  const position = computed(() => positions.value[ply.value]);
  const lastPly = computed(() => positions.value.length - 1);
  const sideToMove = computed(() => (ply.value % 2 === 0 ? 'w' : 'b'));
  const lastMove = computed(() => (ply.value > 0 ? moves.value[ply.value - 1] : null));
  const atStart = computed(() => ply.value === 0);
  const atEnd = computed(() => ply.value === lastPly.value);

  function canMoveFrom(square: string): boolean {
    const piece = position.value[square];
    return !!piece && piece.startsWith(sideToMove.value);
  }

  /** Play from -> to. Moving while viewing an earlier position drops the later moves. */
  function move(from: string, to: string): boolean {
    if (from === to || !canMoveFrom(from)) {
      return false;
    }
    const next: Position = { ...position.value };
    next[to] = next[from];
    delete next[from];

    positions.value = [...positions.value.slice(0, ply.value + 1), next];
    moves.value = [...moves.value.slice(0, ply.value), { from, to }];
    ply.value += 1;
    return true;
  }

  const goTo = (n: number) => {
    ply.value = Math.min(Math.max(n, 0), lastPly.value);
  };
  const back = () => goTo(ply.value - 1);
  const forward = () => goTo(ply.value + 1);
  const toStart = () => goTo(0);
  const toEnd = () => goTo(lastPly.value);

  return {
    moves,
    ply,
    position,
    sideToMove,
    lastMove,
    atStart,
    atEnd,
    canMoveFrom,
    move,
    goTo,
    back,
    forward,
    toStart,
    toEnd,
  };
}
