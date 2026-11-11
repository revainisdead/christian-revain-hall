import { computed, ref } from 'vue';
import { Chess, DEFAULT_POSITION, Move, PieceSymbol, Square } from 'chess.js';
import { FILES, PieceRole, Position, RANKS } from 'components/chessAssets';
import { AttackerMap } from 'components/attackMap';

export type PromotionRole = 'q' | 'r' | 'b' | 'n';

/** One legal destination for the move preview; `victim` is the square of the piece it captures. */
export interface PreviewMove {
  to: string;
  victim: string | null;
}

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

  /**
   * Who attacks each square in the shown position (chess.js `attackers`, same rules as
   * python-chess `board.attackers`): defenders count, pins are ignored, no x-rays.
   */
  const attackers = computed<AttackerMap>(() =>
    Object.fromEntries(
      RANKS.flatMap((rank) => FILES.map((file) => `${file}${rank}` as Square)).map((square) => [
        square,
        { w: current.value.attackers(square, 'w'), b: current.value.attackers(square, 'b') },
      ])
    )
  );

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

  /**
   * Legal destinations of the piece on `from`, one per square (promotion choices merged).
   * `victim` is the square of the enemy piece the move would capture: the target square,
   * or for en passant the pawn beside it.
   */
  function previewMoves(from: string): PreviewMove[] {
    if (status.value.over) {
      return [];
    }
    const byTarget = new Map<string, PreviewMove>();
    current.value.moves({ square: from as Square, verbose: true }).forEach((m) => {
      let victim: string | null = null;
      if (m.isEnPassant()) {
        victim = `${m.to[0]}${m.from[1]}`;
      } else if (m.captured) {
        victim = m.to;
      }
      byTarget.set(m.to, { to: m.to, victim });
    });
    return [...byTarget.values()];
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

  /** Replace the game with these UCI moves (e.g. `e2e4`, `e7e8q`) and jump to the end. */
  function load(uciMoves: string[]) {
    const game = new Chess(startFen);
    history.value = uciMoves.map((uci) =>
      game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    );
    ply.value = history.value.length;
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
    attackers,
    atStart,
    atEnd,
    laterMoves,
    legalTargets,
    previewMoves,
    canMoveFrom,
    check,
    move,
    goTo,
    back,
    forward,
    toStart,
    toEnd,
    load,
  };
}

export type BoardHistory = ReturnType<typeof useBoardHistory>;
