import { describe, expect, it } from "vitest";
import {
  computeBulbRingLayout,
  computeBulbRingTopOffset,
  computeStageMinWidth,
  computeWheelInnerSize,
} from "./wheelFrame";

describe("computeBulbRingLayout", () => {
  it("returns the requested bulb count, keeps orbit inside the ring, and avoids NaN", () => {
    const layout = computeBulbRingLayout({ wheelInnerSize: 280, bulbCount: 20 });
    expect(layout.bulbs).toHaveLength(20);
    expect(layout.outerDiameter).toBeGreaterThan(0);
    expect(layout.bulbOrbit).toBeLessThan(layout.outerDiameter / 2);
    expect(Number.isFinite(layout.bulbOrbit)).toBe(true);

    for (const b of layout.bulbs) {
      expect(Number.isFinite(b.left)).toBe(true);
      expect(Number.isFinite(b.top)).toBe(true);
      expect(Number.isNaN(b.left)).toBe(false);
      expect(Number.isNaN(b.top)).toBe(false);
      const cx = b.left + layout.bulbDiameter / 2;
      const cy = b.top + layout.bulbDiameter / 2;
      const dist = Math.hypot(cx - layout.outerDiameter / 2, cy - layout.outerDiameter / 2);
      expect(dist).toBeCloseTo(layout.bulbOrbit, 5);
      expect(dist).toBeLessThan(layout.outerDiameter / 2);
    }
  });

  it("clamps bulb count to a safe range", () => {
    const hi = computeBulbRingLayout({ wheelInnerSize: 260, bulbCount: 99 });
    expect(hi.bulbs.length).toBeLessThanOrEqual(32);
    const lo = computeBulbRingLayout({ wheelInnerSize: 260, bulbCount: 2 });
    expect(lo.bulbs.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps bulb annulus inside stroked-ring chrome (no overlap math)", () => {
    const bOut = 3;
    const bIn = 5;
    const g = 1;
    const eff = 1.09;
    const layout = computeBulbRingLayout({
      wheelInnerSize: 300,
      bulbCount: 20,
      ringBorderOuterPx: bOut,
      ringInnerStrokeMaxPx: bIn,
      bulbToStrokeGapPx: g,
    });
    const half = layout.outerDiameter / 2;
    const bulbREff = (layout.bulbDiameter / 2) * eff;
    expect(layout.bulbOrbit + bulbREff + Math.max(bIn, bOut) + g).toBeLessThanOrEqual(half + 0.51);
  });
});

describe("stage helpers", () => {
  it("aligns ring top to wheel disc center", () => {
    const layout = computeBulbRingLayout({ wheelInnerSize: 300, bulbCount: 18 });
    const top = computeBulbRingTopOffset(300, layout.outerDiameter);
    expect(top).toBe(150 - layout.outerDiameter / 2);
  });

  it("computeStageMinWidth is at least the wheel and knob width", () => {
    const layout = computeBulbRingLayout({ wheelInnerSize: 248, bulbCount: 20 });
    expect(computeStageMinWidth(248, layout.outerDiameter)).toBeGreaterThanOrEqual(248);
    expect(computeStageMinWidth(248, layout.outerDiameter)).toBeGreaterThanOrEqual(50);
  });

  it("computeWheelInnerSize returns an even dimension", () => {
    expect(computeWheelInnerSize(400) % 2).toBe(0);
  });
});
