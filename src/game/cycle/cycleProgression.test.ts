import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import {
  buildProgressionTable,
  getCycleRewardPackage,
  getProgressionRow,
  PROGRESSION_PREVIEW_CYCLES,
} from "./cycleProgression";

describe("cycleProgression table", () => {
  it("preview cycles escalate money and loss mults", () => {
    const table = buildProgressionTable([...PROGRESSION_PREVIEW_CYCLES]);
    expect(table[0]!.cycle).toBe(1);
    expect(table[table.length - 1]!.moneyMult).toBeGreaterThan(table[0]!.moneyMult);
    expect(table[table.length - 1]!.lossMult).toBeGreaterThan(table[0]!.lossMult);
    expect(table[table.length - 1]!.negativeWeightMult).toBeGreaterThan(
      table[0]!.negativeWeightMult
    );
  });

  it("boss stakes in table rise with perks", () => {
    const solo = getProgressionRow(5, 0);
    const loaded = getProgressionRow(5, 5);
    expect(loaded.bossStakesMult).toBeGreaterThan(solo.bossStakesMult);
  });

  it("late-cycle spike flag turns on at cycle 4", () => {
    expect(getProgressionRow(3).lateCycleSpikes).toBe(false);
    expect(getProgressionRow(4).lateCycleSpikes).toBe(true);
  });

  it("cycle reward package scales with floor", () => {
    const low = RunManager.createInitialRun(1);
    const high = { ...RunManager.createInitialRun(10), money: 500 };
    expect(getCycleRewardPackage(high).money).toBeGreaterThan(getCycleRewardPackage(low).money);
  });
});
