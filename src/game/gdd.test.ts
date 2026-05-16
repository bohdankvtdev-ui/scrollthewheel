import { describe, expect, it } from "vitest";
import { getBlindQuota, getWheelDifficultyBias } from "./gdd";

describe("GDD pacing", () => {
  it("raises blind quota each floor", () => {
    expect(getBlindQuota(2)).toBeGreaterThan(getBlindQuota(1));
    expect(getBlindQuota(5)).toBeGreaterThan(getBlindQuota(3));
  });

  it("ante insurance lowers quota", () => {
    const base = getBlindQuota(3, []);
    const insured = getBlindQuota(3, ["ante_insurance"]);
    expect(insured).toBeLessThan(base);
  });

  it("wheel difficulty ramps within floor", () => {
    expect(getWheelDifficultyBias(8, 1)).toBeGreaterThan(getWheelDifficultyBias(0, 1));
    expect(getWheelDifficultyBias(4, 3)).toBeGreaterThan(getWheelDifficultyBias(4, 1));
  });
});
