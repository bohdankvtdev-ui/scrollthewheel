/** Deterministic pseudo-random + organic scatter (stable per screen size). */

export function quantizeLayout(n: number, step = 20): number {
  return Math.round(n / step) * step;
}

export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Point = { x: number; y: number };

function dist(a: Point, b: Point, w: number, h: number): number {
  const dx = (a.x - b.x) * w;
  const dy = (a.y - b.y) * h;
  return Math.hypot(dx, dy);
}

/** Scatter points in a normalized rect with min spacing (organic, not grid). */
export function scatterOrganic(
  count: number,
  seed: number,
  opts: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minDistPx: number;
    width: number;
    height: number;
    reject?: (x: number, y: number) => boolean;
    maxAttempts?: number;
  }
): Point[] {
  const rand = mulberry32(seed);
  const placed: Point[] = [];
  const maxAttempts = opts.maxAttempts ?? count * 40;

  for (let n = 0; n < count; n++) {
    let placedOne = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = opts.minX + rand() * (opts.maxX - opts.minX);
      const y = opts.minY + rand() * (opts.maxY - opts.minY);
      if (opts.reject?.(x, y)) continue;

      let ok = true;
      for (const p of placed) {
        if (dist({ x, y }, p, opts.width, opts.height) < opts.minDistPx) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      placed.push({ x, y });
      placedOne = true;
      break;
    }
    if (!placedOne) {
      placed.push({
        x: opts.minX + rand() * (opts.maxX - opts.minX),
        y: opts.minY + rand() * (opts.maxY - opts.minY),
      });
    }
  }
  return placed;
}

/** Visual center band for hero wheels (normalized coords). */
export function wheelClusterCenter(width: number, height: number): { cx: number; cy: number } {
  return { cx: width / 2, cy: height * 0.36 };
}

export function isInPlayButtonZone(x: number, y: number): boolean {
  return x > 0.28 && x < 0.72 && y > 0.78;
}

export function isInTitleZone(x: number, y: number): boolean {
  return y < 0.11 && x > 0.22 && x < 0.78;
}
