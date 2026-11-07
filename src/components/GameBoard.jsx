// Canvas 게임판: 크기 조절, 렌더 루프, 마우스·터치 입력
import { useEffect, useRef } from 'react';
import { N } from '../game/constants';
import { renderFrame } from '../game/renderer';

export default function GameBoard({ engine, onSwap, onCellClick, children }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const size = useRef({ cell: 60, dpr: 1 });
  const down = useRef(null);

  // 화면 크기에 맞춰 캔버스 해상도 조절
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const w = wrapRef.current.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = w * dpr;
      canvas.style.height = `${w}px`;
      size.current = { cell: w / N, dpr };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // 렌더 루프
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let id;
    const loop = (now) => {
      renderFrame(ctx, engine.current, size.current.cell, size.current.dpr, now);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [engine]);

  const cellAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * N);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * N);
    return r >= 0 && r < N && c >= 0 && c < N ? [r, c] : null;
  };

  const handleDown = (e) => {
    if (engine.current.busy) return;
    const p = cellAt(e);
    if (!p) return;
    down.current = { p, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // 끌기: 칸 크기의 35% 이상 움직이면 그 방향 이웃과 교체
  const handleMove = (e) => {
    const d = down.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    const th = (canvasRef.current.getBoundingClientRect().width / N) * 0.35;
    if (Math.abs(dx) < th && Math.abs(dy) < th) return;
    const [r, c] = d.p;
    let r2 = r, c2 = c;
    if (Math.abs(dx) > Math.abs(dy)) c2 += Math.sign(dx);
    else r2 += Math.sign(dy);
    down.current = null;
    if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N) onSwap(r, c, r2, c2);
  };

  const handleUp = () => {
    const d = down.current;
    if (!d) return;
    down.current = null;
    onCellClick(d.p[0], d.p[1]);
  };

  return (
    <div className="board" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={() => { down.current = null; }}
      />
      {children}
    </div>
  );
}
