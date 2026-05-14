import { describe, expect, it } from "vitest";
import { computeMaxActiveIndex } from "./reelStripModel";
import type { ScrollWheelRound } from "./hooks/useScrollTheWheelRounds";

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
