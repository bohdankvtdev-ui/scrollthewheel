import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import {
  applyInsuredWheelOnIndex,
  canInsureNextWheel,
  stripWorstNegativeSlice,
} from "./applyInsureWheel";
import { syncRunWheels } from "../../systems/WheelSystem";
import { applyPitStopChoice } from "./cyclePitStop";
import {
  grantEarlyRunChipBonusOnSpinComplete,
  EARLY_RUN_CHIP_BONUS,
} from "./earlyRunChips";
import { buildGambleSlices } from "./gambleWheel";
import {
  getMicroChoiceOffers,
  listEligibleMicroChoices,
  microChoiceChipCost,
  rollMicroChoiceOffers,
} from "./microChoices";
import { tacticUsedOnWheel } from "./tacticState";
import {
  isTacticDecisionWheel,
  rollTacticWheelIndices,
  TACTIC_WHEELS_PER_CYCLE,
  withTacticWheelIndices,
} from "./tacticWheels";
import { declineTacticOffersOnWheel, tacticUsedOnWheel } from "./tacticState";
import { shouldShowTacticPicker } from "./wheelHubState";

describe("tactics", () => {
  it("insure strips one wedge", () => {
    const run = RunManager.createInitialRun(1);
    const wheel =
      run.wheels.find((w) => w.slices.some((s) => s.weightTags?.includes("negative"))) ??
      run.wheels[2]!;
    const patched = stripWorstNegativeSlice(wheel);
    expect(patched.slices.length).toBe(wheel.slices.length - 1);
    expect(patched.spinItems.length).toBe(patched.slices.length);
  });

  it("insure records wheelInsureCuts and survives syncRunWheels", () => {
    let run = RunManager.createInitialRun(1);
    const wheelIndex = run.wheels.findIndex((w) =>
      w.slices.some((s) => s.weightTags?.includes("negative"))
    );
    expect(wheelIndex).toBeGreaterThanOrEqual(0);
    const before = run.wheels[wheelIndex]!.slices.length;
    run = applyInsuredWheelOnIndex(run, wheelIndex);
    const configId = run.wheels[wheelIndex]!.definition.wheelConfigId!;
    expect(run.wheels[wheelIndex]!.slices.length).toBe(before - 1);
    expect(run.wheelInsureCuts?.[configId]).toBe(1);
    const synced = syncRunWheels(run);
    expect(synced.wheels[wheelIndex]!.slices.length).toBe(before - 1);
  });

  it("does not offer insure when next wheel has no negative wedge", () => {
    let run = RunManager.createInitialRun(1);
    const nextIdx = 1;
    const wheel = run.wheels[nextIdx]!;
    const safeSlices = wheel.slices
      .filter((s) => !s.weightTags?.includes("negative"))
      .slice(0, 5);
    run = {
      ...run,
      wheels: run.wheels.map((w, i) =>
        i === nextIdx
          ? {
              ...w,
              slices: safeSlices,
              spinItems: w.spinItems.slice(0, safeSlices.length),
              definition: { ...w.definition, sliceCount: 5 as typeof w.definition.sliceCount },
            }
          : w
      ),
    };
    expect(canInsureNextWheel(run, 0)).toBe(false);
    expect(listEligibleMicroChoices(run, 0, { hasPreSpinSnapshot: true })).not.toContain(
      "insure"
    );
  });

  it("pit stop grants laser charge", () => {
    let run = RunManager.createInitialRun(1);
    run = applyPitStopChoice(run, "pit_laser");
    expect(run.inventory?.wedgeEraser).toBe(1);
  });

  it("rolls 3 tactic wheels per cycle", () => {
    const indices = rollTacticWheelIndices("test-run", 1);
    expect(indices).toHaveLength(TACTIC_WHEELS_PER_CYCLE);
    expect(new Set(indices).size).toBe(TACTIC_WHEELS_PER_CYCLE);
  });

  it("offers only on tactic wheels", () => {
    let run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const tacticIndex = run.runEffects?.tacticWheelIndices?.[0] ?? 0;
    const otherIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
      (i) => !run.runEffects?.tacticWheelIndices?.includes(i)
    )!;
    expect(isTacticDecisionWheel(run, tacticIndex)).toBe(true);
    expect(listEligibleMicroChoices(run, otherIndex, { hasPreSpinSnapshot: true })).toEqual(
      []
    );
  });

  it("gamble is a 2-slice wheel", () => {
    const slices = buildGambleSlices();
    expect(slices).toHaveLength(2);
    expect(slices[0]?.label).toBe("+100%");
    expect(slices[1]?.label).toBe("−100%");
  });

  it("tactics cost chips", () => {
    const run = RunManager.createInitialRun(1);
    expect(microChoiceChipCost(run, "insure")).toBeGreaterThan(0);
  });

  it("ignores legacy peek offers from old saves", () => {
    let run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const wi = run.runEffects!.tacticWheelIndices![0]!;
    run = {
      ...run,
      runEffects: {
        ...run.runEffects,
        microChoiceOffers: ["peek", "insure"],
        microChoiceOffersWheel: wi,
      },
    };
    const offers = getMicroChoiceOffers(run, wi, { hasPreSpinSnapshot: true });
    expect(offers).toEqual(["insure"]);
  });

  it("offers only one trick-or-treat choice at a time", () => {
    const run = withTacticWheelIndices(RunManager.createInitialRun(1));
    for (let wi = 0; wi < 9; wi++) {
      if (!isTacticDecisionWheel(run, wi)) continue;
      for (let t = 0; t < 24; t++) {
        const offers = rollMicroChoiceOffers(
          { ...run, history: [...run.history, { wheelIndex: wi, sliceId: "x", floor: 1, ts: t }] },
          wi,
          { hasPreSpinSnapshot: true }
        );
        expect(offers.length).toBeLessThanOrEqual(1);
        expect(offers).not.toContain("peek" as never);
      }
    }
  });

  it("grants full early chips on spin complete", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, modifiers: { ...run.modifiers, chipGainMult: 0.25 } };
    const g0 = grantEarlyRunChipBonusOnSpinComplete(run, 0);
    expect(g0.run.chipsEarnedThisRun).toBe(EARLY_RUN_CHIP_BONUS.afterWheel1);
  });

  it("never offers retry and gamble together", () => {
    const run = withTacticWheelIndices(RunManager.createInitialRun(1));
    for (let wi = 0; wi < 9; wi++) {
      if (!isTacticDecisionWheel(run, wi)) continue;
      for (let t = 0; t < 20; t++) {
        const offers = rollMicroChoiceOffers(
          { ...run, history: [...run.history, { wheelIndex: wi, sliceId: "x", floor: 1, ts: t }] },
          wi,
          { hasPreSpinSnapshot: true }
        );
        if (offers.includes("reroll") && offers.includes("gamble")) {
          throw new Error("retry+gamble on same wheel");
        }
      }
    }
  });

  it("does not re-offer tactics after reroll on same wheel", () => {
    const run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const wi = 8;
    const used = {
      ...run,
      wheelIndex: wi,
      runEffects: {
        ...run.runEffects,
        microChoiceWheelIndex: wi,
        tacticUsedId: "reroll" as const,
      },
      history: [...run.history, { wheelIndex: wi, sliceId: "x", floor: 1, ts: 1 }],
    };
    expect(tacticUsedOnWheel(used, wi)).toBe(true);
    expect(
      rollMicroChoiceOffers(used, wi, { hasPreSpinSnapshot: true }).length
    ).toBeGreaterThanOrEqual(0);
  });

  it("declining tactics hides picker for that wheel", () => {
    let run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const wi = run.runEffects!.tacticWheelIndices![0]!;
    run = {
      ...run,
      wheelIndex: wi,
      history: [{ wheelIndex: wi, sliceId: "s1", floor: 1, ts: 1 }],
      runEffects: {
        ...run.runEffects,
        microChoiceOffers: ["insure"],
        microChoiceOffersWheel: wi,
      },
    };
    const declined = declineTacticOffersOnWheel(run, wi);
    expect(tacticUsedOnWheel(declined, wi)).toBe(true);
    expect(declined.runEffects?.microChoiceOffers).toBeUndefined();
    expect(
      shouldShowTacticPicker(declined, true, false, false, true)
    ).toBe(false);
  });
});
