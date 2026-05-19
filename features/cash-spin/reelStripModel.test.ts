import { describe, expect, it } from "vitest";
import { computeMaxActiveIndex, computeStripIndexAfterClaim } from "./reelStripModel";
import type { ScrollWheelRound } from "./reelStripModel";

function rounds(...statuses: ScrollWheelRound["status"][]): ScrollWheelRound[] {
  return statuses.map((status) => ({ status, prize: null }));
}

describe("computeMaxActiveIndex", () => {
  it("returns 0 for empty list", () => {
    expect(computeMaxActiveIndex([])).toBe(0);
  });

  it("stops on first ready round", () => {
    const r = rounds("claimed", "ready", "locked");
    expect(computeMaxActiveIndex(r)).toBe(1);
  });

  it("allows stepping past won to next index", () => {
    const r = rounds("claimed", "won", "locked");
    expect(computeMaxActiveIndex(r)).toBe(2);
  });
});

describe("computeStripIndexAfterClaim", () => {
  it("wraps from last won wheel to index 0 (cycle 2 start)", () => {
    const r = rounds("claimed", "claimed", "won");
    expect(computeStripIndexAfterClaim(2, r)).toBe(0);
  });

  it("returns null when current round is not won", () => {
    const r = rounds("claimed", "ready", "locked");
    expect(computeStripIndexAfterClaim(1, r)).toBeNull();
  });

  it("steps forward on mid-floor won wheel", () => {
    const r = rounds("claimed", "won", "locked");
    expect(computeStripIndexAfterClaim(1, r)).toBe(2);
  });
});
