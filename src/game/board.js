// 게임판 순수 로직: 판 생성, 맞추기 판정, 이동 가능 여부
import { N, TYPES } from './constants';

let nextId = 1;
const rnd = (n) => Math.floor(Math.random() * n);

/** 보석 객체. x, y는 화면상 위치(칸 단위)로 애니메이션 중 소수가 된다. */
export function createGem(t, r, c) {
  return { id: nextId++, t, x: c, y: r, scale: 1 };
}

export const randomType = () => rnd(TYPES);

/** 맞춰진 줄·사각형이 없고, 바꿀 수 있는 수가 있는 새 판 */
export function createBoard() {
  for (;;) {
    const grid = [];
    for (let r = 0; r < N; r++) {
      grid.push([]);
      for (let c = 0; c < N; c++) {
        let t;
        do {
          t = randomType();
        } while (
          (c >= 2 && grid[r][c - 1].t === t && grid[r][c - 2].t === t) ||
          (r >= 2 && grid[r - 1][c].t === t && grid[r - 2][c].t === t) ||
          (r >= 1 && c >= 1 && grid[r - 1][c - 1].t === t && grid[r - 1][c].t === t && grid[r][c - 1].t === t)
        );
        grid[r].push(createGem(t, r, c));
      }
    }
    if (findMove(grid)) return grid;
  }
}

/** 같은 보석 2×2 사각형의 왼쪽 위 좌표 목록 */
export function findSquares(grid) {
  const list = [];
  for (let r = 0; r < N - 1; r++) {
    for (let c = 0; c < N - 1; c++) {
      const a = grid[r][c], b = grid[r][c + 1], d = grid[r + 1][c], e = grid[r + 1][c + 1];
      if (a && b && d && e && a.t === b.t && a.t === d.t && a.t === e.t) list.push([r, c]);
    }
  }
  return list;
}

/** 사라질 칸의 집합 (r * N + c). 3개 이상 줄 + 2×2 사각형 */
export function findMatches(grid) {
  const set = new Set();
  const same = (a, b) => a && b && a.t === b.t;

  for (let r = 0; r < N; r++) {
    let run = 1;
    for (let c = 1; c <= N; c++) {
      if (c < N && same(grid[r][c], grid[r][c - 1])) run++;
      else {
        if (run >= 3) for (let k = 1; k <= run; k++) set.add(r * N + c - k);
        run = 1;
      }
    }
  }
  for (let c = 0; c < N; c++) {
    let run = 1;
    for (let r = 1; r <= N; r++) {
      if (r < N && same(grid[r][c], grid[r - 1][c])) run++;
      else {
        if (run >= 3) for (let k = 1; k <= run; k++) set.add((r - k) * N + c);
        run = 1;
      }
    }
  }
  for (const [r, c] of findSquares(grid)) {
    set.add(r * N + c);
    set.add(r * N + c + 1);
    set.add((r + 1) * N + c);
    set.add((r + 1) * N + c + 1);
  }
  return set;
}

export function swapCells(grid, r1, c1, r2, c2) {
  const tmp = grid[r1][c1];
  grid[r1][c1] = grid[r2][c2];
  grid[r2][c2] = tmp;
}

/** 맞추기가 생기는 교체 하나를 [r1, c1, r2, c2]로 반환, 없으면 null */
export function findMove(grid) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 >= N || c2 >= N) continue;
        swapCells(grid, r, c, r2, c2);
        const ok = findMatches(grid).size > 0;
        swapCells(grid, r, c, r2, c2);
        if (ok) return [r, c, r2, c2];
      }
    }
  }
  return null;
}

/** 판 전체 종류를 섞어 맞춰진 것이 없고 수가 있는 판으로 만든다 */
export function shuffleTypes(grid) {
  const all = grid.flat();
  do {
    const ts = all.map((g) => g.t);
    for (let i = ts.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [ts[i], ts[j]] = [ts[j], ts[i]];
    }
    all.forEach((g, i) => { g.t = ts[i]; });
  } while (findMatches(grid).size || !findMove(grid));
}

/**
 * 빈 칸(null)을 채운다. 남은 보석은 아래로 내리고 새 보석은 판 위에서 시작한다.
 * 애니메이션에 쓸 { gem, from, to } 목록을 반환한다.
 */
export function applyGravity(grid) {
  const moving = [];
  for (let c = 0; c < N; c++) {
    let write = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      const g = grid[r][c];
      if (!g) continue;
      grid[r][c] = null;
      grid[write][c] = g;
      if (write !== r) moving.push({ gem: g, from: g.y, to: write });
      write--;
    }
    const missing = write + 1;
    for (let r = write; r >= 0; r--) {
      const g = createGem(randomType(), r - missing, c);
      grid[r][c] = g;
      moving.push({ gem: g, from: g.y, to: r });
    }
  }
  return moving;
}

/** 점수 계산 (PRD 4.4) */
export function scoreFor(gemCount, squareCount, combo, pointsPerGem, squareBonus) {
  return (gemCount * pointsPerGem + squareCount * squareBonus) * combo;
}
