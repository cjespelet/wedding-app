type Tile = {
  la0: number;
  la1: number;
  lo0: number;
  lo1: number;
  r: number;
  flash: number;
};

type Ball = {
  ctx: CanvasRenderingContext2D;
  size: number;
  tiles: Tile[];
  phase: number;
};

function seeded(start: number): () => number {
  let s = start;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildBall(cv: HTMLCanvasElement): Ball | null {
  const size = Number(cv.dataset.size);
  if (!size) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = cv.height = Math.round(size * dpr);
  cv.style.width = cv.style.height = `${size}px`;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;

  const rnd = seeded(Number(cv.dataset.seed) || 1);
  const bands = size > 70 ? 14 : 10;
  const tiles: Tile[] = [];
  for (let i = 0; i < bands; i++) {
    const la0 = -Math.PI / 2 + (Math.PI * i) / bands;
    const la1 = -Math.PI / 2 + (Math.PI * (i + 1)) / bands;
    const segs = Math.max(6, Math.round(bands * 2 * Math.cos((la0 + la1) / 2)));
    for (let j = 0; j < segs; j++) {
      tiles.push({
        la0,
        la1,
        lo0: (2 * Math.PI * j) / segs,
        lo1: (2 * Math.PI * (j + 1)) / segs,
        r: rnd(),
        flash: rnd(),
      });
    }
  }
  return { ctx, size: size * dpr, tiles, phase: rnd() * 6 };
}

function drawBall(b: Ball, t: number): void {
  const { ctx, size, tiles } = b;
  const R = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  const rot = b.phase + t * 0.00018;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, size, size);

  const gap = size * 0.006;
  const project = (la: number, lo: number): [number, number] => [
    cx + R * Math.cos(la) * Math.sin(lo),
    cy - R * Math.sin(la),
  ];

  for (const tl of tiles) {
    const a0 = tl.lo0 + rot;
    const a1 = tl.lo1 + rot;
    const mid = (a0 + a1) / 2;
    const lm = (tl.la0 + tl.la1) / 2;
    const nz = Math.cos(lm) * Math.cos(mid);
    if (nz <= 0.02) continue;
    const nx = Math.cos(lm) * Math.sin(mid);
    const ny = Math.sin(lm);
    const light = Math.max(0, -0.45 * nx + 0.55 * ny + 0.7 * nz);
    const glint = Math.pow(Math.max(0, Math.sin(t * 0.0011 + tl.flash * 40)), 30);
    const v = Math.min(1, 0.22 + light * 0.5 + tl.r * 0.18 + glint * 0.6);
    const g = Math.round(28 + v * 220);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    const p = [project(tl.la0, a0), project(tl.la0, a1), project(tl.la1, a1), project(tl.la1, a0)];
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let k = 1; k < 4; k++) ctx.lineTo(p[k][0], p[k][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = gap;
    ctx.stroke();
  }

  const shade = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.2, cx, cy, R);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

export function initDiscoBalls(): void {
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('canvas.js-disco')];
  if (!canvases.length) return;
  const balls = canvases.map(buildBall).filter((b): b is Ball => b !== null);
  if (!balls.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  balls.forEach((b) => drawBall(b, 0));
  if (reduce) return;

  let last = 0;
  const loop = (t: number) => {
    if (t - last > 33) {
      balls.forEach((b) => drawBall(b, t));
      last = t;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
