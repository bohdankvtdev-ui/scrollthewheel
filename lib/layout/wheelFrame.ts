/**
 * Pure layout for the bulb ring around the local `wheel` SpinWheel.
 * Pointer is overlaid inside the disc — ring center aligns with the wheel center.
 */

import { NeoWheel } from "../../theme/neoBrutal";

const MIN_WHEEL = 200;
const MAX_WHEEL = 400;
const MIN_BULBS = 6;
const MAX_BULBS = 32;

/** Only pad layout when explicitly widening the marquee; extra px mostly pushed bulbs inward visually. */
const BULB_RING_OUTER_DIAMETER_BOOST = 0;

/**
 * Must stay in sync with `SpinWheel` arc geometry: `.outerRadius(size / 2 - inset)`.
 * Bulb orbit is measured from the **visible prize ring** outer edge, not `size / 2`.
 */
export const SPIN_WHEEL_PRIZE_RING_OUTER_INSET = 1;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function roundEven(n: number): number {
  const r = Math.round(n);
  return r % 2 === 0 ? r : r + 1;
}

/** Canonical wheel size for layout + `SpinWheel` (even, clamped) — keeps disc and bulb ring concentric. */
export function normalizeWheelInnerSize(raw: number): number {
  return roundEven(clamp(Math.round(raw), MIN_WHEEL, MAX_WHEEL));
}

export type BulbRingLayout = {
  outerDiameter: number;
  /** Distance from ring center to each bulb center. */
  bulbOrbit: number;
  bulbDiameter: number;
  /** Bulb top-left positions in coordinates where (0,0) is top-left of the square `outerDiameter` box. */
  bulbs: { left: number; top: number }[];
};

export type BulbRingLayoutInput = {
  wheelInnerSize: number;
  bulbCount: number;
  bulbDiameter?: number;
  rimGap?: number;
  outerPad?: number;
  /**
   * Outer ring view border (px), drawn inside the `outerDiameter` box — reduces usable radius.
   * Default 3; keep aligned with app `Neo.borderThin`.
   */
  ringBorderOuterPx?: number;
  /**
   * Worst-case width of the animated stroked circle (px). Bulb outer edge must stay inside
   * `half − ringInnerStrokeMaxPx` so bulbs sit in the gold band, not under the inner stroke.
   * Default 5 — align with `NeoBulbRing` animated border clamp max.
   */
  ringInnerStrokeMaxPx?: number;
  /** Radial gap from effective bulb outer edge to the inner stroke (px). Default 1. */
  bulbToStrokeGapPx?: number;
};

/**
 * Geometry only: bulb orbit, outer square size, and bulb positions (top-left for each bulb View).
 */
export function computeBulbRingLayout(input: BulbRingLayoutInput): BulbRingLayout {
  const wheel = normalizeWheelInnerSize(input.wheelInnerSize);
  const bulbCount = Math.round(clamp(input.bulbCount, MIN_BULBS, MAX_BULBS));
  const bulbDiameter = roundEven(
    clamp(
      input.bulbDiameter ?? Math.round(wheel * 0.022),
      8,
      Math.max(8, Math.floor(wheel * 0.044))
    )
  );
  /** Gap from visible prize rim to bulb inner edge (px). Smaller = bulbs sit closer to the disc. */
  const rimGap = clamp(input.rimGap ?? Math.round(wheel * 0.010), 2, 10);
  /** Narrow band outside bulb hull before chrome — smaller pulls bulbs toward the outer rim without bloating diameter. */
  const outerPad = clamp(input.outerPad ?? Math.round(rimGap * 0.38), 2, 5);

  /**
   * Arc math uses the path outer radius; half the stroke extends outside that path
   * (`NeoWheel.segmentStrokeWidth` — thin slice rim). Bulb clearance starts at the **visible** rim.
   */
  const prizeStrokeHalf = NeoWheel.segmentStrokeWidth / 2;
  const prizeRingVisualOuter = wheel / 2 - SPIN_WHEEL_PRIZE_RING_OUTER_INSET + prizeStrokeHalf;
  const bulbR = bulbDiameter / 2;
  /** Effective bulb outer radius (layout uses full circles; Reanimated scale ≈1.08 needs headroom). */
  const bulbOuterEff = bulbR * 1.09;

  const bOut = clamp(input.ringBorderOuterPx ?? 3, 0, 12);
  const bIn = clamp(input.ringInnerStrokeMaxPx ?? 5, 0, 16);
  const gStroke = clamp(input.bulbToStrokeGapPx ?? 1, 0, 10);

  /** Min hub → bulb center: bulb inner clears **visible** prize rim (incl. stroke). */
  const rMin = prizeRingVisualOuter + rimGap + bulbR;
  /** Gold band thickness outside bulbs before the chrome ring (px). */
  const padGold = outerPad;

  /**
   * Both borders sit on the same outer circumference — only the **wider** one eats usable
   * radius (do not add bIn + bOut or bulbs sit too far inward in a large ring).
   */
  const bChrome = Math.max(bIn, bOut);

  /**
   * Max bulb-center radius so scaled bulb hull + gold pad + chrome stays inside `hf`.
   * Must use `bulbOuterEff` (same as iteration clamp), not `bulbR`, or the blend band is
   * mis-sized and inward bias barely changes pixels.
   */
  const bulbOrbitSeed = clamp(
    rMin + (bulbOuterEff - bulbR) + padGold - gStroke,
    rMin,
    rMin + wheel * 0.35
  );

  let outerDiameter = roundEven((bulbOrbitSeed + bulbOuterEff + padGold + bChrome) * 2);
  let bulbOrbit = bulbOrbitSeed;

  /** 1 = stay at outer safe orbit (`rAnnulusOuter`). Lower values bias inward — raising this alone used to force larger `outerDiameter`. */
  const bulbOrbitInwardBlend = 0.8;

  for (let step = 0; step < 20; step += 1) {
    const hf = outerDiameter / 2;
    const rAnnulusOuter = hf - bChrome - bulbOuterEff - gStroke;
    const rBandOuter = Math.max(rMin, rAnnulusOuter);
    const targetOrbit = rMin + (rBandOuter - rMin) * bulbOrbitInwardBlend;
    bulbOrbit = clamp(targetOrbit, rMin, rAnnulusOuter);
    const radialNeed = bulbOrbit + bulbOuterEff + padGold + bChrome;
    if (radialNeed <= hf + 0.02) break;
    outerDiameter = roundEven(outerDiameter + 2);
  }

  outerDiameter = roundEven(outerDiameter + BULB_RING_OUTER_DIAMETER_BOOST);

  const cx = outerDiameter / 2;
  const cy = outerDiameter / 2;
  const bulbs: { left: number; top: number }[] = [];
  for (let i = 0; i < bulbCount; i += 1) {
    /** Half-step indexing: even angular spacing, bulbs sit between index seams (more symmetric on screen). */
    const angle = ((i + 0.5) / bulbCount) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(angle) * bulbOrbit - bulbR;
    const by = cy + Math.sin(angle) * bulbOrbit - bulbR;
    bulbs.push({ left: bx, top: by });
  }

  return { outerDiameter, bulbOrbit, bulbDiameter, bulbs };
}

/** Vertical offset so the ring center matches the wheel SVG center. */
export function computeBulbRingTopOffset(wheelInnerSize: number, outerDiameter: number): number {
  const w = normalizeWheelInnerSize(wheelInnerSize);
  const o = outerDiameter;
  return w / 2 - o / 2;
}

export function computeStageMinWidth(
  wheelInnerSize: number,
  outerDiameter: number
): number {
  return Math.max(outerDiameter, 50, normalizeWheelInnerSize(wheelInnerSize));
}

export function computeWheelInnerSize(windowMin: number): number {
  const s = Math.round(Math.max(272, Math.min(windowMin * 0.82, 372)));
  return roundEven(clamp(s, MIN_WHEEL, MAX_WHEEL));
}

export function computeSpinWheelTextSize(wheelInnerSize: number): number {
  return Math.max(15, Math.round(wheelInnerSize * 0.054));
}
