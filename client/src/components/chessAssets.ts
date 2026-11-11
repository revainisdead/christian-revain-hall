// Paths into client/public for the Cburnett chess set (served as static files).
const SET_ROOT = '/JohnPablok Cburnett Chess set/PNGs';

export type PieceColor = 'w' | 'b';
export type PieceRole = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceCode = `${PieceColor}_${PieceRole}`;

// Square name ("e4") -> piece on that square.
export type Position = Record<string, PieceCode>;

/** What drew an arrow; sets its default style. `preview` = where the selected piece can go. */
export type ArrowKind = 'test' | 'preview';

// Overlay arrow between two squares; color is any canvas color (default depends on kind).
export interface Arrow {
  from: string;
  to: string;
  color?: string;
  kind?: ArrowKind;
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

export function pieceImage(code: PieceCode): string {
  return encodeURI(`${SET_ROOT}/With Shadow/128px/${code}_png_shadow_128px.png`);
}

export function squareImage(dark: boolean): string {
  const shade = dark ? 'dark' : 'light';
  return encodeURI(`${SET_ROOT}/No shadow/128h/square brown ${shade}_png_128px.png`);
}

const BACK_RANK: PieceRole[] = [
  'rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook',
];

export function startingPosition(): Position {
  const position: Position = {};
  FILES.forEach((file, i) => {
    position[`${file}1`] = `w_${BACK_RANK[i]}`;
    position[`${file}2`] = 'w_pawn';
    position[`${file}7`] = 'b_pawn';
    position[`${file}8`] = `b_${BACK_RANK[i]}`;
  });
  return position;
}

const LETTER: Record<PieceRole, string> = {
  king: 'k',
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
  pawn: 'p',
};
const ROLE_OF = Object.fromEntries(
  Object.entries(LETTER).map(([role, letter]) => [letter, role as PieceRole])
);

/** Position -> FEN piece placement (the first FEN field), e.g. the start is `rnbqkbnr/pppppppp/8/...`. */
export function toPlacement(position: Position): string {
  return RANKS.map((rank) =>
    FILES.map((file) => {
      const piece = position[`${file}${rank}`];
      if (!piece) {
        return '1';
      }
      const [color, role] = piece.split('_') as [PieceColor, PieceRole];
      return color === 'w' ? LETTER[role].toUpperCase() : LETTER[role];
    })
      .join('')
      .replace(/1+/g, (run) => String(run.length))
  ).join('/');
}

/** FEN piece placement -> Position; null if it isn't 8 ranks of 8 squares. */
export function fromPlacement(placement: string): Position | null {
  const rows = placement
    .split('/')
    .map((row) => row.replace(/[1-8]/g, (n) => '.'.repeat(Number(n))));
  if (rows.length !== 8 || rows.some((row) => !/^[.kqrbnpKQRBNP]{8}$/.test(row))) {
    return null;
  }
  return Object.fromEntries(
    rows.flatMap((row, r) =>
      [...row].flatMap((ch, f) =>
        ch === '.'
          ? []
          : [[`${FILES[f]}${RANKS[r]}`, `${ch === ch.toUpperCase() ? 'w' : 'b'}_${ROLE_OF[ch.toLowerCase()]}`]]
      )
    )
  );
}
