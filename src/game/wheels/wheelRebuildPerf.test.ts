import { describe, expect, it } from "vitest";
import { getPrizeSlotsForWheel } from "./database/loader";
import { summarizeCycleBeforeBoss } from "../boss/bossWheel";
import { WHEEL_DATABASE_REVISION } from "./database/wheelDatabase";
import { withTacticWheelIndices } from "../tactics/tacticWheels";
import { commitPendingWheelRebuild } from "../../systems/PerkSystem";
import { rebuildWheelsFromDatabase } from "../../systems/WheelSystem";
import type { RunState } from "../../schemas";

function seedRun(): RunState {
  let run = withTacticWheelIndices({
    runId: "perf-test-run",
    phase: "active",
    floor: 1,
    wheelIndex: 6,
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
    permanentWedgeBonus: 0,
    pendingWheelRebuild: false,
    floorsCleared: 0,
    history: Array.from({ length: 6 }, (_, i) => ({
      wheelIndex: i,
      sliceId: `wheel_${i + 1}_test_0`,
      floor: 1,
      ts: i,
    })),
    wheels: [],
    winStreak: 0,
    peakMoney: 500,
    wheelDbRevision: WHEEL_DATABASE_REVISION,
  } as RunState);
  run = rebuildWheelsFromDatabase(run);
  return run;
}

describe("buildFinalWheel / rebuild", () => {
  it("wheel_9 with 7 slices does not hang (builder +1 wedge)", () => {
    const t0 = Date.now();
    const slots = getPrizeSlotsForWheel("wheel_9", {
      runId: "perf-boss-7",
      cycle: 1,
      permanentWedgeBonus: 1,
      bossCycleAudit: summarizeCycleBeforeBoss(
        {
          runId: "perf-boss-7",
          floor: 1,
          wheelIndex: 6,
          money: 500,
          peakMoney: 500,
          perks: [],
          history: Array.from({ length: 6 }, (_, i) => ({
            wheelIndex: i,
            sliceId: `wheel_${i + 1}_x_0`,
            floor: 1,
            ts: i,
          })),
        } as RunState,
        []
      ),
    });
    expect(slots.length).toBe(7);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});

describe("commitPendingWheelRebuild", () => {
  it("completes builder +1 wedge rebuild under 3s", () => {
    let run = seedRun();
    run = {
      ...run,
      sliceCapacity: 7,
      permanentWedgeBonus: 1,
      pendingWheelRebuild: true,
      history: [
        ...run.history,
        { wheelIndex: 6, sliceId: "wheel_7_builder_wedge_percent_1", floor: 1, ts: 99 },
      ],
    };
    const t0 = Date.now();
    const next = commitPendingWheelRebuild(run);
    const ms = Date.now() - t0;
    expect(ms).toBeLessThan(3000);
    expect(next.pendingWheelRebuild).toBe(false);
    expect(next.wheels[6]!.slices.length).toBe(7);
  });
});
