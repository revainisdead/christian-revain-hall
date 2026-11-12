import { PieceCode, PieceColor, PieceRole, Position } from 'components/chessAssets';

/** Attacking squares per side for every square of the board (from chess.js `attackers`). */
export type AttackerMap = Record<string, Record<PieceColor, string[]>>;

/**
 * Attacker bubbles: the green (yours) and red (theirs) number circles in a square's bottom
 * corners, counting the pieces that attack it. Shown on occupied squares, every square, or off.
 */
export type BubbleMode = 'off' | 'occupied' | 'all';

/** Whose side "you" are: the side to move, or a fixed color. */
export type ViewAs = 'auto' | PieceColor;

export interface SquareBubbles {
  mine: number;
  theirs: number;
  /** Your piece stands here and yours cover it: the green bubble is defense (a green shield). */
  mineShield: boolean;
  /** Their piece stands here and theirs cover it: the red bubble is defense (a red shield). */
  theirsShield: boolean;
}

export interface Threat {
  square: string;
  piece: PieceCode;
  attackers: number;
  defenders: number;
  loss: number; // material you lose if they start the exchange (0 = it holds)
}

/** Usual material values. The king only matters as the last piece in an exchange. */
export const PIECE_VALUE: Record<PieceRole, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};

const other = (color: PieceColor): PieceColor => (color === 'w' ? 'b' : 'w');
const roleOf = (piece: PieceCode) => piece.split('_')[1] as PieceRole;
const valuesOn = (position: Position, squares: string[]) =>
  squares.map((s) => PIECE_VALUE[roleOf(position[s])]).sort((a, b) => a - b);

/** Attacker bubbles per square: green = your attackers, red = theirs, filtered by the mode. */
export function attackerBubbles(
  attackers: AttackerMap,
  position: Position,
  me: PieceColor,
  mode: BubbleMode
): Record<string, SquareBubbles> {
  if (mode === 'off') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(attackers)
      .filter(([square]) => mode === 'all' || position[square])
      .map(([square, by]) => [
        square,
        {
          mine: by[me].length,
          theirs: by[other(me)].length,
          mineShield: by[me].length > 0 && Boolean(position[square]?.startsWith(me)),
          theirsShield: by[other(me)].length > 0 && Boolean(position[square]?.startsWith(other(me))),
        },
      ])
  );
}

/**
 * The exchange on one square (a simple static exchange evaluation). Capturers alternate,
 * attacker first, each side using its cheapest piece first, until the side due to capture runs
 * out: 2A captures if the defenders last, 2D + 1 if the attackers outnumber them.
 *
 * Returns `outcome[k]`: what the side making capture k nets from there on, given that each
 * later side recaptures only when that pays (it may always stop). v1 limits, as for the counts:
 * no x-rays (a rook behind a rook doesn't join), pins ignored, no promotion on the last rank.
 */
export function exchangeOutcomes(target: number, attackers: number[], defenders: number[]) {
  const captures = Math.min(2 * attackers.length, 2 * defenders.length + 1);
  const capturers = attackers.flatMap((a, i) => [a, defenders[i]]).slice(0, captures);
  if (!capturers.length) {
    return [];
  }
  // The piece standing on the square when capture k happens: the target, then each capturer.
  const onSquare = [target, ...capturers.slice(0, -1)];
  return onSquare.reduceRight<number[]>(
    (later, piece) => [piece - Math.max(0, later[0] ?? 0), ...later],
    []
  );
}

/** Material you lose if the opponent starts the exchange only when it pays (0 = it holds). */
export function exchangeLoss(target: number, attackers: number[], defenders: number[]): number {
  return Math.max(0, exchangeOutcomes(target, attackers, defenders)[0] ?? 0);
}

/** Your pieces (not the king) that the opponent attacks, most urgent first, top `limit`. */
export function threatsTo(
  attackers: AttackerMap,
  position: Position,
  me: PieceColor,
  limit = 5
): Threat[] {
  return Object.entries(position)
    .filter(([, piece]) => piece.startsWith(me) && roleOf(piece) !== 'king')
    .map(([square, piece]) => {
      const att = attackers[square][other(me)];
      const def = attackers[square][me];
      return {
        square,
        piece,
        attackers: att.length,
        defenders: def.length,
        loss: exchangeLoss(
          PIECE_VALUE[roleOf(piece)],
          valuesOn(position, att),
          valuesOn(position, def)
        ),
      };
    })
    .filter((t) => t.attackers > 0)
    .sort(
      (a, b) =>
        b.loss - a.loss ||
        PIECE_VALUE[roleOf(b.piece)] - PIECE_VALUE[roleOf(a.piece)] ||
        a.square.localeCompare(b.square)
    )
    .slice(0, limit);
}

export interface BattleStep {
  from: string;
  piece: PieceCode; // the capturing piece
  captured: PieceCode;
  side: 'them' | 'you';
  balance: number; // your running material, from your side
  position: Position; // the board after this capture
}

export interface Battle {
  square: string;
  piece: PieceCode; // your piece under attack
  me: PieceColor;
  attackers: number;
  defenders: number;
  start: Position;
  steps: BattleStep[];
  loss: number; // as in the threat list: what you lose if they start only when it pays
}

/**
 * The battle on one of your squares, capture by capture. The opponent always makes the first
 * capture, so a piece that holds shows *why* it holds; after that each side only goes on while
 * it pays (the same rule as `exchangeLoss`). Hypothetical: pieces move without checking whose
 * turn it is, pins or promotion (v1 limits).
 */
export function battleOn(
  square: string,
  attackers: AttackerMap,
  position: Position,
  me: PieceColor
): Battle {
  const valueAt = (s: string) => PIECE_VALUE[roleOf(position[s])];
  const cheapestFirst = (squares: string[]) =>
    [...squares].sort((a, b) => valueAt(a) - valueAt(b) || a.localeCompare(b));
  const att = cheapestFirst(attackers[square][other(me)]);
  const def = cheapestFirst(attackers[square][me]);
  const outcomes = exchangeOutcomes(valueAt(square), att.map(valueAt), def.map(valueAt));
  const stop = outcomes.slice(1).findIndex((o) => o <= 0);
  const played = stop === -1 ? outcomes.length : stop + 1;
  const order = att.flatMap((a, i) => [a, def[i]]).slice(0, outcomes.length);
  const sideOf = (i: number): 'them' | 'you' => (i % 2 === 0 ? 'them' : 'you');

  const steps = order.slice(0, played).reduce<BattleStep[]>((done, from, i) => {
    const before = done.length ? done[done.length - 1].position : position;
    const captured = before[square];
    const after: Position = { ...before, [square]: before[from] };
    delete after[from];
    const value = PIECE_VALUE[roleOf(captured)];
    const balance = (done.length ? done[done.length - 1].balance : 0) + (i % 2 ? value : -value);
    return [
      ...done,
      { from, piece: before[from], captured, side: sideOf(i), balance, position: after },
    ];
  }, []);

  return {
    square,
    piece: position[square],
    me,
    attackers: att.length,
    defenders: def.length,
    start: position,
    steps,
    loss: Math.max(0, outcomes[0] ?? 0),
  };
}
