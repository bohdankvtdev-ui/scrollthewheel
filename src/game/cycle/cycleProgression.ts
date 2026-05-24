import type { RunState, SliceDefinition, SpinEvent } from "../../schemas";
import type { WheelConfigId } from "../wheels/database/types";
import { getCycleEconomy } from "../wheels/database/cycleEconomy";
import { cycleClearChipReward } from "../shop/chipGrants";
import { countPerkCopies } from "../perks/perkStacks";
import { getCycleAdvancement, getInfinitePressure } from "../effects/cycleAdvancement";
import { getScalingParams } from "../infiniteScalingConfig";
import { getBossStakesMult } from "../boss/bossWheel";
import { LATE_CYCLE_MIN } from "../wheels/database/lateCycleEvents";

export { getSliceCountForCycle } from "../advancements/sliceCount";
export { landShapeForSliceCount } from "../wheels/database/prizeRng";

export type CycleRewardPackage = {
  cycle: number;
  chips: number;
  money: number;
  headline: string;
  detail: string;
};

/** Escalating payout for clearing a cycle — applied when entering `won` phase. */
export const CYCLE_CLEAR_REWARD = {
  moneyBase: 12,
  moneyPerCycle: 12,
} as const;

export function cycleClearMoneyReward(cycle: number): number {
  const c = Math.max(1, cycle);
  return CYCLE_CLEAR_REWARD.moneyBase + c * CYCLE_CLEAR_REWARD.moneyPerCycle;
}

/** Escalating payout for clearing a cycle — applied when entering `won` phase. */
export function getCycleRewardPackage(run: RunState): CycleRewardPackage {
  const cycle = run.floor;
  const chips =
    cycleClearChipReward(cycle) +
    countPerkCopies(run.perks, "cycle_tithe") +
    countPerkCopies(run.perks, "chip_hoarder") * 2;
  const money = cycleClearMoneyReward(cycle);
  return {
    cycle,
    chips,
    money,
    headline: `Cycle ${cycle} cleared`,
    detail: `+$${money} bank · +${chips} shop chips`,
  };
}

export type RunInventory = {
  wedgeEraser: number;
};

export const DEFAULT_INVENTORY: RunInventory = { wedgeEraser: 0 };

export function getBanishedPrizes(
  run: RunState,
  wheelId: WheelConfigId
): string[] {
  return run.banishedPrizes?.[wheelId] ?? [];
}

/** Cycles shown in the in-app “Infinite” design tab. */
export const PROGRESSION_PREVIEW_CYCLES = [1, 2, 3, 5, 10, 20, 50] as const;

/**
 * One row of the infinite-run progression table — economy, scaling, and boss pressure.
 * Use for balancing reviews and `GameContent.snapshot()`.
 */
export type ProgressionRow = {
  cycle: number;
  advancementTier: number;
  advancementLabel: string;
  moneyMult: number;
  lossMult: number;
  percentGain: number;
  negativeWeightMult: number;
  stakesMult: number;
  moneyInflationMult: number;
  bossStakesMult: number;
  cycleClearMoney: number;
  cycleClearChips: number;
  /** Cycle 4+ — rare jackpots, wipe, harm spikes on wheels */
  lateCycleSpikes: boolean;
};

export function getProgressionRow(cycle: number, perkCount = 0): ProgressionRow {
  const c = Math.max(1, cycle);
  const econ = getCycleEconomy(c);
  const adv = getCycleAdvancement(c);
  const scale = getScalingParams(c);
  const pressure = getInfinitePressure(c);
  const clearMoney = cycleClearMoneyReward(c);
  const clearChips = cycleClearChipReward(c);
  return {
    cycle: c,
    advancementTier: adv.tier,
    advancementLabel: adv.label,
    moneyMult: Math.round(econ.moneyMult * 100) / 100,
    lossMult: Math.round(econ.lossMult * 100) / 100,
    percentGain: Math.round(econ.percentGain * 1000) / 1000,
    negativeWeightMult:
      Math.round(scale.negativeWeightMult * pressure.negativeWeightMult * 100) / 100,
    stakesMult: Math.round(scale.stakesMult * pressure.stakesMult * 100) / 100,
    moneyInflationMult: Math.round(scale.moneyInflationMult * 100) / 100,
    bossStakesMult: Math.round(getBossStakesMult(c, perkCount) * 100) / 100,
    cycleClearMoney: clearMoney,
    cycleClearChips: clearChips,
    lateCycleSpikes: c >= LATE_CYCLE_MIN,
  };
}

export function buildProgressionTable(
  cycles: readonly number[] = PROGRESSION_PREVIEW_CYCLES,
  perkCount = 0
): ProgressionRow[] {
  return cycles.map((c) => getProgressionRow(c, perkCount));
}
