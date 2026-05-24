import {
  isInPlayButtonZone,
  isInTitleZone,
  mulberry32,
  scatterOrganic,
  wheelClusterCenter,
} from "./homeOrganicLayout";

export type DollarParticleSpec = {
  id: string;
  size: number;
  left: number;
  top: number;
  opacity: number;
  driftX: number;
  driftY: number;
  floatMs: number;
  layer: "bg" | "fg";
};

export function buildFloatingDollars(width: number, height: number): DollarParticleSpec[] {
  if (width < 200 || height < 400) return [];

  const { cx, cy } = wheelClusterCenter(width, height);
  const clusterR = Math.min(width, height) * 0.34;

  const rejectCoin = (x: number, y: number) => {
    if (isInPlayButtonZone(x, y) || isInTitleZone(x, y)) return true;
    const dx = x * width - cx;
    const dy = y * height - cy;
    return Math.hypot(dx, dy) < clusterR * 0.85;
  };

  const bgPoints = scatterOrganic(5, 0x51ed0d, {
    minX: 0.04,
    maxX: 0.96,
    minY: 0.1,
    maxY: 0.88,
    minDistPx: 52,
    width,
    height,
    reject: rejectCoin,
  });

  const fgPoints = scatterOrganic(4, 0x8badf00d, {
    minX: 0.06,
    maxX: 0.94,
    minY: 0.12,
    maxY: 0.82,
    minDistPx: 64,
    width,
    height,
    reject: (x, y) => rejectCoin(x, y) || (x > 0.35 && x < 0.65 && y > 0.3 && y < 0.62),
  });

  const randBg = mulberry32(0x600d);
  const randFg = mulberry32(0xf00d);

  const specs: DollarParticleSpec[] = [];

  for (let i = 0; i < bgPoints.length; i++) {
    const p = bgPoints[i]!;
    const size = 18 + Math.floor(randBg() * 14);
    specs.push({
      id: `bg-${i}`,
      size,
      left: Math.round(p.x * width - size / 2),
      top: Math.round(p.y * height - size / 2),
      opacity: 0.2 + randBg() * 0.18,
      driftX: 8 + randBg() * 10,
      driftY: 9 + randBg() * 11,
      floatMs: 6200 + Math.floor(randBg() * 2800),
      layer: "bg",
    });
  }

  for (let i = 0; i < fgPoints.length; i++) {
    const p = fgPoints[i]!;
    const size = 24 + Math.floor(randFg() * 12);
    specs.push({
      id: `fg-${i}`,
      size,
      left: Math.round(p.x * width - size / 2),
      top: Math.round(p.y * height - size / 2),
      opacity: 0.5 + randFg() * 0.35,
      driftX: 10 + randFg() * 12,
      driftY: 10 + randFg() * 12,
      floatMs: 4800 + Math.floor(randFg() * 2600),
      layer: "fg",
    });
  }

  return specs;
}
