// Paths into client/public for the Cburnett chess set (served as static files).
const SET_ROOT = '/JohnPablok Cburnett Chess set/PNGs';

export type PieceColor = 'w' | 'b';
export type PieceRole = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceCode = `${PieceColor}_${PieceRole}`;

// Square name ("e4") -> piece on that square.
export type Position = Record<string, PieceCode>;

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
