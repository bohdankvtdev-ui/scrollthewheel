import { describe, expect, it } from "vitest";
import { WHEEL_DATABASE_REVISION } from "../wheels/database/wheelDatabase";
import { withTacticWheelIndices } from "./tacticWheels";
import { declineTacticOffersOnWheel } from "./tacticState";
import {
  blocksReelAdvanceForTactics,
  deriveHubMode,
  reconcileRunUi,
  shouldShowTacticPicker,
} from "./wheelHubState";
import type { RunState } from "../../schemas";

function tacticRun(wheelIndex = 3): RunState {
  return withTacticWheelIndices({
    runId: "tactic-flow-test",
    phase: "active",
    floor: 1,
    wheelIndex,
    money: 500,
    chipsEarnedThisRun: 0,
    modifiers: {
      moneyGainMult: 1,
      moneyLossMult: 1,
      rareWeightMult: 1,
      chipGainMult: 1,
    },
    runEffects: {
      tacticWheelIndices: [wheelIndex],
      microChoiceOffers: ["reroll"],
      microChoiceOffersWheel: wheelIndex,
    },
    pendingJokerOffers: [],
    deck: [],
    perks: [],
    advancements: [],
    shields: 0,
    shieldPerks: [],
    debuffs: [],
    relics: [],
    sliceCapacity: 6,
    floorsCleared: 0,
    history: [{ wheelIndex, sliceId: "wheel_4_perk_x_0", floor: 1, ts: 1 }],
    wheels: [],
    winStreak: 0,
    peakMoney: 500,
    wheelDbRevision: WHEEL_DATABASE_REVISION,
  } as RunState);
}

describe("wheelHubState tactic gating", () => {
  it("blocks reel advance while tactic picker is active", () => {
    const base = withTacticWheelIndices({
      runId: "tactic-flow-test",
      phase: "active",
      floor: 1,
      wheelIndex: 0,
      money: 500,
      chipsEarnedThisRun: 0,
      modifiers: {
        moneyGainMult: 1,
        moneyLossMult: 1,
        rareWeightMult: 1,
        chipGainMult: 1,
      },
      runEffects: {},
      pendingJokerOffers: [],
      deck: [],
      perks: [],
      advancements: [],
      shields: 0,
      shieldPerks: [],
      debuffs: [],
      relics: [],
      sliceCapacity: 6,
      floorsCleared: 0,
      history: [],
      wheels: [],
      winStreak: 0,
      peakMoney: 500,
      wheelDbRevision: WHEEL_DATABASE_REVISION,
    } as RunState);
    const wi = base.runEffects!.tacticWheelIndices![0]!;
    const run = tacticRun(wi);
    expect(shouldShowTacticPicker(run, true, false, false, true)).toBe(true);
    expect(blocksReelAdvanceForTactics(run, true, false, false, true)).toBe(true);
  });

  it("allows reel advance after skip (decline)", () => {
    const base = withTacticWheelIndices({
      runId: "tactic-flow-test-2",
      phase: "active",
      floor: 1,
      wheelIndex: 0,
      money: 500,
      chipsEarnedThisRun: 0,
      modifiers: {
        moneyGainMult: 1,
        moneyLossMult: 1,
        rareWeightMult: 1,
        chipGainMult: 1,
      },
      runEffects: {},
      pendingJokerOffers: [],
      deck: [],
      perks: [],
      advancements: [],
      shields: 0,
      shieldPerks: [],
      debuffs: [],
      relics: [],
      sliceCapacity: 6,
      floorsCleared: 0,
      history: [],
      wheels: [],
      winStreak: 0,
      peakMoney: 500,
      wheelDbRevision: WHEEL_DATABASE_REVISION,
    } as RunState);
    const wi = base.runEffects!.tacticWheelIndices![0]!;
    const run = tacticRun(wi);
    const skipped = declineTacticOffersOnWheel(run, wi);
    expect(blocksReelAdvanceForTactics(skipped, true, false, false, true)).toBe(false);
  });

  it("reconcileRunUi restores awaitingClaim when spin history exists on current wheel", () => {
    const run = tacticRun(3);
    const healed = reconcileRunUi(run, {
      awaitingClaim: false,
      gambleFlipActive: false,
      isSpinning: false,
      spinWheelIndex: null,
      lastResultLabel: null,
      lastSliceId: null,
      lastEffect: null,
      lastRewardKind: null,
      moneyReveal: null,
    });
    expect(healed.awaitingClaim).toBe(true);
    expect(healed.lastSliceId).toBe("wheel_4_perk_x_0");
  });

  it("deriveHubMode returns claim when awaiting prize without tactic picker", () => {
    const run = declineTacticOffersOnWheel(tacticRun(3), 3);
    const mode = deriveHubMode({
      run,
      roundIndex: 3,
      isSpinning: false,
      awaitingClaim: true,
      gambleFlipActive: false,
      isReelActive: true,
      round: { status: "won", prize: { id: "x", label: "Perk" } },
    });
    expect(mode).toBe("claim");
  });
});
