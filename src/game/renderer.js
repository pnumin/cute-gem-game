// Canvas 렌더링: 게임판, 이모지 보석, 파티클, 떠오르는 점수
import { N, EMOJIS, COLORS } from './constants';

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}

function drawGem(ctx, t, cx, cy, R, glow) {
  const col = COLORS[t];
  ctx.save();
  if (glow) {
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = R * 0.8;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
  g.addColorStop(0, shade(col, 0.7));
  g.addColorStop(1, shade(col, 0.1));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = shade(col, -0.25);
  ctx.lineWidth = Math.max(1, R * 0.07);
  ctx.stroke();

  ctx.font = `${R * 1.3}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EMOJIS[t], cx, cy + R * 0.08);
  ctx.restore();
}

/** 파티클 생성 (PRD F11) */
export function spawnParticles(engine, gem) {
  const col = COLORS[gem.t];
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 0.03 + Math.random() * 0.08;
    engine.particles.push({
      x: gem.x + 0.5, y: gem.y + 0.5,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.03,
      life: 1, col,
    });
  }
}

/** 한 프레임 그리기. engine은 가변 게임 상태(ref) */
export function renderFrame(ctx, engine, cell, dpr, now) {
  const { grid, selected, hint } = engine;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = cell * N;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, W);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#0d0d16' : '#14141f';
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, W);
  ctx.clip();

  if (selected) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(selected[1] * cell + 3, selected[0] * cell + 3, cell - 6, cell - 6);
  }

  const hintCells = hint ? [[hint[0], hint[1]], [hint[2], hint[3]]] : [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const g = grid[r][c];
      if (!g || g.scale <= 0) continue;
      let s = g.scale;
      if (selected && selected[0] === r && selected[1] === c) s *= 1 + Math.sin(now / 120) * 0.06;
      const isHint = hintCells.some(([hr, hc]) => hr === r && hc === c);
      if (isHint) s *= 1 + Math.sin(now / 150) * 0.1;
      drawGem(ctx, g.t, (g.x + 0.5) * cell, (g.y + 0.5) * cell, cell * 0.4 * s, isHint);
    }
  }

  engine.particles = engine.particles.filter((p) => p.life > 0);
  for (const p of engine.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.004;
    p.life -= 0.025;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x * cell, p.y * cell, cell * 0.06 * p.life + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  engine.floaters = engine.floaters.filter((f) => f.life > 0);
  ctx.font = `bold ${cell * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  for (const f of engine.floaters) {
    f.life -= 0.02;
    f.y -= 0.015;
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(f.text, (f.x + 0.5) * cell, (f.y + 0.5) * cell);
    ctx.fillText(f.text, (f.x + 0.5) * cell, (f.y + 0.5) * cell);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
