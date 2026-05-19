import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import {
  bailoutMoneyAmount,
  listEligibleDesperation,
  rollDesperationOffers,
} from "./desperationTactics";

describe("desperationTactics", () => {
  it("lists retry when snapshot exists and chips cover cost", () => {
    const run = {
      ...RunManager.createInitialRun(1),
      chipsEarnedThisRun: 20,
    };
    const eligible = listEligibleDesperation(run, { hasPreSpinSnapshot: true });
    expect(eligible).toContain("reroll");
    expect(eligible).toContain("bailout");
  });

  it("bailout scales with peak money", () => {
    const run = { ...RunManager.createInitialRun(1), peakMoney: 1000, money: 0 };
    expect(bailoutMoneyAmount(run)).toBeGreaterThanOrEqual(100);
  });

  it("does not repeat desperation in the same run after offered", () => {
    const run = {
      ...RunManager.createInitialRun(1),
      chipsEarnedThisRun: 30,
      runEffects: { desperationOfferedThisRun: true },
    };
    expect(rollDesperationOffers(run, { hasPreSpinSnapshot: true })).toEqual([]);
  });
});
