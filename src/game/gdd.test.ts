import { describe, expect, it } from "vitest";
import { GDD_PACING, getBlindQuota, getCycleParams, getWheelDifficultyBias } from "./gdd";

describe("GDD pacing", () => {
  it("uses 9 wheels per cycle", () => {
    expect(GDD_PACING.wheelsPerCycle).toBe(9);
  });

  it("raises cycle bonus quota each cycle", () => {
    expect(getBlindQuota(2)).toBeGreaterThan(getBlindQuota(1));
    expect(getBlindQuota(5)).toBeGreaterThan(getBlindQuota(3));
  });

  it("ante insurance lowers quota", () => {
    const base = getBlindQuota(3, []);
    const insured = getBlindQuota(3, ["ante_insurance"]);
    expect(insured).toBeLessThan(base);
  });

  it("wheel difficulty ramps within cycle", () => {
    expect(getWheelDifficultyBias(8, 1)).toBeGreaterThan(getWheelDifficultyBias(0, 1));
    expect(getWheelDifficultyBias(4, 3)).toBeGreaterThan(getWheelDifficultyBias(4, 1));
  });

  it("cycle 2+ injects negatives and shop pressure", () => {
    const c2 = getCycleParams(2);
    const c1 = getCycleParams(1);
    expect(c2.negativeSliceInject).toBeGreaterThan(c1.negativeSliceInject);
    expect(c2.shopPriceMult).toBeGreaterThan(c1.shopPriceMult);
  });
});
