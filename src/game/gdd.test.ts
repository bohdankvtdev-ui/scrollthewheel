import { describe, expect, it } from "vitest";
import { GDD_PACING, getCycleParams, getWheelDifficultyBias } from "./gdd";

describe("GDD pacing", () => {
  it("uses 9 wheels per cycle", () => {
    expect(GDD_PACING.wheelsPerCycle).toBe(9);
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
