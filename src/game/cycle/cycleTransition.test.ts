import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { ALPHA_CAMPAIGN_CYCLES } from "../gdd";
import {
  isBossWheelClaim,
  previewNextCycleRun,
  transitionRunAfterBossClear,
} from "./cycleTransition";

describe("cycleTransition", () => {
  it("detects boss wheel claim", () => {
    const run = { ...RunManager.createInitialRun(1), wheelIndex: 8, phase: "active" as const };
    expect(isBossWheelClaim(run, 8)).toBe(true);
    expect(isBossWheelClaim(run, 7)).toBe(false);
  });

  it("previews next cycle wheels without applying rewards", () => {
    const run = {
      ...RunManager.createInitialRun(1),
      wheelIndex: 8,
      money: 100,
      floor: 1,
    };
    const preview = previewNextCycleRun(run);
    expect(preview.floor).toBe(2);
    expect(preview.wheelIndex).toBe(0);
    expect(preview.money).toBe(100);
    expect(preview.wheels).toHaveLength(9);
  });

  it("transitions to cycle 2 wheel 1 with pit stop pending", () => {
    let run = {
      ...RunManager.createInitialRun(1),
      wheelIndex: 8,
      money: 200,
      history: [{ wheelIndex: 8, sliceId: "test", floor: 1, ts: 1 }],
    };
    const next = transitionRunAfterBossClear(run);
    expect(next.phase).toBe("won");
    expect(next.floor).toBe(2);
    expect(next.wheelIndex).toBe(0);
    expect(next.lastCycleReward?.cycle).toBe(1);
    expect(next.runEffects?.pitStopPending).toBe(true);
    expect(next.money).toBeGreaterThan(200);
  });

  it("pauses at cycle 100 for infinite-or-end choice", () => {
    let run = {
      ...RunManager.createInitialRun(ALPHA_CAMPAIGN_CYCLES),
      wheelIndex: 8,
      money: 5000,
      history: [{ wheelIndex: 8, sliceId: "test", floor: ALPHA_CAMPAIGN_CYCLES, ts: 1 }],
    };
    const next = transitionRunAfterBossClear(run);
    expect(next.phase).toBe("won");
    expect(next.floor).toBe(ALPHA_CAMPAIGN_CYCLES);
    expect(next.runEffects?.alphaMilestonePending).toBe(true);
    expect(next.runEffects?.pitStopPending).toBe(false);
    expect(next.lastCycleReward?.cycle).toBe(ALPHA_CAMPAIGN_CYCLES);
  });
});
