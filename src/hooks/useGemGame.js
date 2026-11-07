// 게임 진행 훅: 가변 게임판(engine ref)과 화면에 보일 상태(React state)를 관리
import { useCallback, useEffect, useRef, useState } from 'react';
import { N, MAX_MOVES, POINTS_PER_GEM, SQUARE_BONUS, BEST_KEY } from '../game/constants';
import {
  createBoard, findMatches, findSquares, findMove, swapCells,
  applyGravity, shuffleTypes, scoreFor,
} from '../game/board';
import {
  tween, easeInOut, easeOutBounce, SWAP_MS, CLEAR_MS, SHUFFLE_MS, fallDuration,
} from '../game/animation';
import { spawnParticles } from '../game/renderer';

function loadBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* 저장 불가 환경 */ }
}

export function useGemGame() {
  // 60fps로 바뀌는 값은 리렌더 없이 ref에 둔다
  const engine = useRef(null);
  if (!engine.current) {
    engine.current = {
      grid: createBoard(),
      selected: null,
      hint: null,
      busy: false,
      particles: [],
      floaters: [],
    };
    // 개발 모드에서만 콘솔 디버깅용으로 노출
    if (import.meta.env.DEV) window.__gemEngine = engine.current;
  }

  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [best, setBest] = useState(loadBest);
  const [gameOver, setGameOver] = useState(false);
  const [banner, setBanner] = useState(null); // { text, key }

  const scoreRef = useRef(0);
  const movesRef = useRef(MAX_MOVES);
  const bestRef = useRef(best);

  const addScore = useCallback((pts) => {
    scoreRef.current += pts;
    setScore(scoreRef.current);
    if (scoreRef.current > bestRef.current) {
      bestRef.current = scoreRef.current;
      setBest(bestRef.current);
      saveBest(bestRef.current);
    }
  }, []);

  const showBanner = useCallback((text) => setBanner({ text, key: Date.now() }), []);

  useEffect(() => {
    if (!banner) return undefined;
    const id = setTimeout(() => setBanner(null), 700);
    return () => clearTimeout(id);
  }, [banner]);

  const animateSwap = (a, b) => {
    const ax = a.x, ay = a.y, bx = b.x, by = b.y;
    return tween(SWAP_MS, (p) => {
      const e = easeInOut(p);
      a.x = ax + (bx - ax) * e; a.y = ay + (by - ay) * e;
      b.x = bx + (ax - bx) * e; b.y = by + (ay - by) * e;
    });
  };

  /** 맞추기 → 제거 → 낙하를 연쇄가 끝날 때까지 반복 (PRD 4.3, 4.4) */
  const resolveBoard = useCallback(async () => {
    const eng = engine.current;
    const { grid } = eng;
    let combo = 0;
    for (;;) {
      const matched = findMatches(grid);
      if (!matched.size) break;
      combo++;
      const squares = findSquares(grid).length;
      const pts = scoreFor(matched.size, squares, combo, POINTS_PER_GEM, SQUARE_BONUS);
      addScore(pts);
      if (squares) showBanner('사각형 보너스!');
      else if (combo >= 2) showBanner(`${combo} 콤보!`);

      const gems = [...matched].map((k) => grid[Math.floor(k / N)][k % N]);
      let sx = 0, sy = 0;
      gems.forEach((g) => { sx += g.x; sy += g.y; spawnParticles(eng, g); });
      eng.floaters.push({ text: `+${pts}`, x: sx / gems.length, y: sy / gems.length, life: 1 });

      await tween(CLEAR_MS, (p) => gems.forEach((g) => { g.scale = 1 - p; }));
      matched.forEach((k) => { grid[Math.floor(k / N)][k % N] = null; });

      const moving = applyGravity(grid);
      const maxD = Math.max(1, ...moving.map((m) => m.to - m.from));
      await tween(fallDuration(maxD), (p) => {
        moving.forEach((m) => { m.gem.y = m.from + (m.to - m.from) * easeOutBounce(p); });
      });
      moving.forEach((m) => { m.gem.y = m.to; });
    }

    if (!findMove(grid)) {
      showBanner('섞는 중...');
      const all = grid.flat();
      await tween(SHUFFLE_MS, (p) => all.forEach((g) => { g.scale = 1 - p; }));
      shuffleTypes(grid);
      await tween(SHUFFLE_MS, (p) => all.forEach((g) => { g.scale = p; }));
    }
  }, [addScore, showBanner]);

  /** 이웃한 두 칸 교체 (PRD 4.2, F1) */
  const trySwap = useCallback(async (r1, c1, r2, c2) => {
    const eng = engine.current;
    if (eng.busy || movesRef.current <= 0) return;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    eng.busy = true;
    eng.selected = null;
    eng.hint = null;

    const { grid } = eng;
    const a = grid[r1][c1], b = grid[r2][c2];
    await animateSwap(a, b);
    swapCells(grid, r1, c1, r2, c2);

    if (findMatches(grid).size === 0) {
      await animateSwap(a, b);
      swapCells(grid, r1, c1, r2, c2);
      eng.busy = false;
      return;
    }

    movesRef.current -= 1;
    setMoves(movesRef.current);
    await resolveBoard();
    eng.busy = false;
    if (movesRef.current <= 0) setGameOver(true);
  }, [resolveBoard]);

  /** 칸 클릭: 선택 / 선택 해제 / 이웃이면 교체 */
  const clickCell = useCallback((r, c) => {
    const eng = engine.current;
    if (eng.busy || movesRef.current <= 0) return;
    const sel = eng.selected;
    if (sel) {
      if (sel[0] === r && sel[1] === c) { eng.selected = null; return; }
      if (Math.abs(sel[0] - r) + Math.abs(sel[1] - c) === 1) { trySwap(sel[0], sel[1], r, c); return; }
    }
    eng.selected = [r, c];
  }, [trySwap]);

  /** 힌트 (PRD F7) */
  const showHint = useCallback(() => {
    const eng = engine.current;
    if (!eng.busy) eng.hint = findMove(eng.grid);
  }, []);

  /** 새 게임 (PRD F10) */
  const newGame = useCallback(() => {
    const eng = engine.current;
    if (eng.busy) return;
    eng.grid = createBoard();
    eng.selected = null;
    eng.hint = null;
    eng.particles = [];
    eng.floaters = [];
    scoreRef.current = 0;
    movesRef.current = MAX_MOVES;
    setScore(0);
    setMoves(MAX_MOVES);
    setGameOver(false);
    setBanner(null);
  }, []);

  return { engine, score, moves, best, gameOver, banner, trySwap, clickCell, showHint, newGame };
}
