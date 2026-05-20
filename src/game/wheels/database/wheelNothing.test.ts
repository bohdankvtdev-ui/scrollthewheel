import { describe, expect, it } from "vitest";
import { NOTHING_PRIZE_ID, nothingWedgeCount } from "./wheelNothing";
import { getConfiguredWheelSlices } from "./loader";

describe("wheelNothing", () => {
  it("cycle 1 has no nothing wedges", () => {
    expect(nothingWedgeCount("wheel_1", 1, 6)).toBe(0);
    expect(nothingWedgeCount("wheel_8", 1, 6)).toBe(0);
    const slices = getConfiguredWheelSlices("wheel_8", "w8c1", 1);
    expect(slices.some((s) => s.id.includes("nothing"))).toBe(false);
  });

  it("adds nothing on later cycles across wheels", () => {
    expect(nothingWedgeCount("wheel_3", 4, 6)).toBeGreaterThan(0);
    const slices = getConfiguredWheelSlices("wheel_1", "w1c5", 5);
    expect(slices.some((s) => s.label === "Nothing" || s.id.includes("nothing"))).toBe(true);
  });

  it("exports stable nothing prize id", () => {
    expect(NOTHING_PRIZE_ID).toBe("neutral_nothing");
  });
});
