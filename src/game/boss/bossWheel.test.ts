import { describe, expect, it } from "vitest";

import { RunManager } from "../../systems/RunManager";

import {

  applyBossAuditToPool,

  getBossCycleClearChips,

  getBossPoolAdjustments,

  getBossStakesMult,

  summarizeCycleBeforeBoss,

} from "./bossWheel";

import { FINAL_WHEEL_POOL } from "../wheels/database/wheelPrizePools";

import { getPrizeSlotsForWheel } from "../wheels/database/loader";



describe("bossWheel", () => {

  it("stakes scale with cycle and perk load", () => {

    expect(getBossStakesMult(1, 0)).toBe(1);

    expect(getBossStakesMult(3, 4)).toBeGreaterThan(getBossStakesMult(1, 0));

  });



  it("cycle clear chips reward bank survival", () => {

    const poor = { floor: 1, money: 0, perks: [] as string[] };

    const rich = { floor: 1, money: 600, perks: ["a", "b", "c"] };

    expect(getBossCycleClearChips(rich as never)).toBeGreaterThan(getBossCycleClearChips(poor as never));

  });



  it("audit heat rises after lucky cycle spins", () => {

    let run = RunManager.createInitialRun(1);

    run = {

      ...run,

      peakMoney: 800,

      money: 750,

      perks: ["lucky_money", "gold_rush"],

      history: [

        { wheelIndex: 0, sliceId: "wheel_1_money_100_0", floor: 1, ts: 1 },

        { wheelIndex: 5, sliceId: "wheel_6_money_500_1", floor: 1, ts: 2 },

        { wheelIndex: 6, sliceId: "wheel_7_builder_wedge_money_0", floor: 1, ts: 3 },

      ],

    };

    const audit = summarizeCycleBeforeBoss(run, run.wheels);

    expect(audit.spins).toBe(3);

    expect(audit.heat).toBeGreaterThan(0.2);

    expect(audit.flatLossBias).toBeGreaterThan(0.15);

  });



  it("hot audit boosts flat loss weights in boss pool", () => {

    const cold = applyBossAuditToPool(FINAL_WHEEL_POOL, {

      spins: 0,

      heat: 0,

      flatLossBias: 0,

      stakesBias: 0,

      perkTaxBias: 0,

      payoutDampen: 0,

    });

    const hot = applyBossAuditToPool(FINAL_WHEEL_POOL, {

      spins: 8,

      heat: 0.9,

      flatLossBias: 0.5,

      stakesBias: 0.4,

      perkTaxBias: 0.3,

      payoutDampen: 0.8,

    });

    const coldLoss = cold.find((p) => p.prize === "money_loss_100")!.weight;

    const hotLoss = hot.find((p) => p.prize === "money_loss_100")!.weight;

    expect(hotLoss).toBeGreaterThan(coldLoss);

    const payPool = [{ prize: "boss_pay_100", weight: 12 }];
    const coldPayPool = applyBossAuditToPool(payPool, {
      spins: 8,
      heat: 0,
      flatLossBias: 0,
      stakesBias: 0,
      perkTaxBias: 0,
      payoutDampen: 0,
    });
    const hotPayPool = applyBossAuditToPool(payPool, {
      spins: 8,
      heat: 0.9,
      flatLossBias: 0.5,
      stakesBias: 0.4,
      perkTaxBias: 0.3,
      payoutDampen: 0.8,
    });
    expect(hotPayPool[0]!.weight).toBeLessThan(coldPayPool[0]!.weight);

  });



  it("boss wheel with audit packs more flat losses than without", () => {

    const base = getPrizeSlotsForWheel("wheel_9", {

      runId: "boss-test",

      cycle: 2,

      ownedPerks: ["lucky_money", "iron_reserve"],

    });

    const tailored = getPrizeSlotsForWheel("wheel_9", {

      runId: "boss-test",

      cycle: 2,

      ownedPerks: ["lucky_money", "iron_reserve"],

      bossCycleAudit: {

        spins: 8,

        heat: 0.85,

        flatLossBias: 0.55,

        stakesBias: 0.4,

        perkTaxBias: 0.35,

        payoutDampen: 0.75,

      },

    });

    const baseLoss = base.filter((s) => s.prize.startsWith("money_loss_")).length;

    const hotLoss = tailored.filter((s) => s.prize.startsWith("money_loss_")).length;

    expect(hotLoss).toBeGreaterThanOrEqual(baseLoss);
    expect(base.some((s) => s.prize === "boss_shield_break")).toBe(false);
    expect(base.some((s) => s.prize === "debt_bomb")).toBe(false);
  });

  it("getBossPoolAdjustments adds no tax rows to boss disc", () => {
    expect(getBossPoolAdjustments(10, 5)).toEqual([]);
  });
});

