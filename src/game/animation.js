// 시간 기반 트윈과 이징 함수

/** ms 동안 매 프레임 fn(진행률 0~1)을 호출하고 끝나면 resolve */
export function tween(ms, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / ms);
      fn(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

export const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

export function easeOutBounce(p) {
  const n = 7.5625, d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
  if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
  return n * (p -= 2.625 / d) * p + 0.984375;
}

export const SWAP_MS = 160;
export const CLEAR_MS = 220;
export const SHUFFLE_MS = 250;
export const fallDuration = (maxDistance) => 180 + maxDistance * 45;
