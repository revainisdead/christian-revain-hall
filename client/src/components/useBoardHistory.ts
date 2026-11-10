import { computed, ref } from 'vue';
import { Chess, DEFAULT_POSITION, Move, PieceSymbol, Square } from 'chess.js';
import { PieceRole, Position } from 'components/chessAssets';

export type PromotionRole = 'q' | 'r' | 'b' | 'n';

/** What happens if `from -> to` is played now. */
export type MoveCheck = 'illegal' | 'needs-promotion' | 'ok';

export interface GameStatus {
  over: boolean;
  result?: '1-0' | '0-1' | '1/2-1/2';
  reason?: string; // "checkmate", "stalemate", ...
  claimable?: string; // a draw rule the player could claim, without ending the game
}

const ROLE: Record<PieceSymbol, PieceRole> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

/** Repetition key: placement, side to move, castling, en passant (FEN fields 1-4). */
const repetitionKey = (fen: string) => fen.split(' ').slice(0, 4).join(' ');
const halfmoveClock = (fen: string) => parseInt(fen.split(' ')[4], 10);

function toPosition(game: Chess): Position {
  const position: Position = {};
  game.board().forEach((row) =>
    row.forEach((cell) => {
      if (cell) {
        position[cell.square] = `${cell.color}_${ROLE[cell.type]}`;
      }
    })
  );
  return position;
}

/**
 * Game end, matching the server (python-chess `board.outcome()` without claims): checkmate,
 * stalemate, insufficient material, fivefold repetition, 75-move rule. Threefold and the
 * 50-move rule only make a draw *claimable*; the game goes on.
 */
function statusOf(game: Chess, repetitions: number): GameStatus {
  const fen = game.fen();
  if (game.isCheckmate()) {
    return { over: true, result: game.turn() === 'w' ? '0-1' : '1-0', reason: 'checkmate' };
  }
  if (game.isStalemate()) {
    return { over: true, result: '1/2-1/2', reason: 'stalemate' };
  }
  if (game.isInsufficientMaterial()) {
    return { over: true, result: '1/2-1/2', reason: 'insufficient material' };
  }
  if (repetitions >= 5) {
    return { over: true, result: '1/2-1/2', reason: 'fivefold repetition' };
  }
  if (halfmoveClock(fen) >= 150) {
    return { over: true, result: '1/2-1/2', reason: '75-move rule' };
  }
  if (repetitions >= 3) {
    return { over: false, claimable: 'threefold repetition' };
  }
  if (halfmoveClock(fen) >= 100) {
    return { over: false, claimable: 'fifty-move rule' };
  }
  return { over: false };
}

/**
 * Board state for one local game: the move list plus a `ply` cursor (0 = start position).
 * chess.js supplies the rules; every position is rebuilt by replaying moves from the start,
 * the same way the server's `board_at` does (needed for repetition rules).
 */
export function useBoardHistory(startFen: string = DEFAULT_POSITION) {
  const history = ref<Move[]>([]);
  const ply = ref(0);

  function gameAt(n: number): Chess {
    const game = new Chess(startFen);
    history.value
      .slice(0, n)
      .forEach((m) => game.move({ from: m.from, to: m.to, promotion: m.promotion }));
    return game;
  }

  const current = computed(() => gameAt(ply.value));
  const position = computed(() => toPosition(current.value));
  const sideToMove = computed(() => current.value.turn());
  const lastPly = computed(() => history.value.length);
  const atStart = computed(() => ply.value === 0);
  const atEnd = computed(() => ply.value === lastPly.value);
  const laterMoves = computed(() => lastPly.value - ply.value);
  const lastMove = computed(() => (ply.value > 0 ? history.value[ply.value - 1] : null));
  const moves = computed(() => history.value.map((m) => m.san));

  const status = computed(() => {
    const replay = new Chess(startFen);
    const keys = [repetitionKey(replay.fen())];
    history.value.slice(0, ply.value).forEach((m) => {
      replay.move({ from: m.from, to: m.to, promotion: m.promotion });
      keys.push(repetitionKey(replay.fen()));
    });
    const here = keys[keys.length - 1];
    return statusOf(current.value, keys.filter((k) => k === here).length);
  });

  /** Square of the king that is in check, if any. */
  const checkSquare = computed<string | null>(() => {
    if (!current.value.inCheck()) {
      return null;
    }
    const turn = current.value.turn();
    const entry = Object.entries(position.value).find(([, p]) => p === `${turn}_king`);
    return entry ? entry[0] : null;
  });

  function legalTargets(from: string): string[] {
    if (status.value.over) {
      return [];
    }
    return current.value.moves({ square: from as Square, verbose: true }).map((m) => m.to);
  }

  function canMoveFrom(square: string): boolean {
    return legalTargets(square).length > 0;
  }

  function check(from: string, to: string): MoveCheck {
    if (status.value.over) {
      return 'illegal';
    }
    const candidates = current.value
      .moves({ square: from as Square, verbose: true })
      .filter((m) => m.to === to);
    if (!candidates.length) {
      return 'illegal';
    }
    return candidates.some((m) => m.promotion) ? 'needs-promotion' : 'ok';
  }

  /** Play from -> to. Playing while viewing an earlier position drops the later moves. */
  function move(from: string, to: string, promotion?: PromotionRole): boolean {
    const kind = check(from, to);
    if (kind === 'illegal' || (kind === 'needs-promotion' && !promotion)) {
      return false;
    }
    const played = gameAt(ply.value).move({ from, to, promotion });
    history.value = [...history.value.slice(0, ply.value), played];
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
    status,
    checkSquare,
    atStart,
    atEnd,
    laterMoves,
    legalTargets,
    canMoveFrom,
    check,
    move,
    goTo,
    back,
    forward,
    toStart,
    toEnd,
  };
}
