// 게임 규칙 상수 (PRD 4장)
export const N = 8;                 // 게임판 크기 8×8
export const MAX_MOVES = 10;        // 한 판 이동 횟수
export const POINTS_PER_GEM = 10;   // 보석 1개당 점수
export const SQUARE_BONUS = 50;     // 2×2 사각형 보너스

// 보석 이모지와 배경색 (PRD 4.1)
export const EMOJIS = ['🐱', '🐶', '🐥', '🐸', '🐳', '🐼'];
export const COLORS = ['#ff8fab', '#ffa94d', '#ffd93d', '#69db7c', '#74c0fc', '#c69cff'];
export const TYPES = EMOJIS.length;

export const BEST_KEY = 'gemBest';
