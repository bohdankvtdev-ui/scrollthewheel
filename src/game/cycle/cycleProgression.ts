import type { RunState } from "../../schemas";
import { clampSliceCount } from "../../schemas/wheel.schema";
import type { WheelConfigId } from "../wheels/database/types";

/** Base wedges per wheel — only builder / shop upgrades add more (`permanentWedgeBonus`). */
export function getSliceCountForCycle(_cycle: number, _advancements: string[] = []): number {
  return clampSliceCount(6);
}

export type CycleRewardPackage = {
  cycle: number;
  chips: number;
  money: number;
  headline: string;
  detail: string;
};

/** Escalating payout for clearing a cycle — applied when entering `won` phase. */
export function getCycleRewardPackage(run: RunState): CycleRewardPackage {
  const cycle = run.floor;
  const chips = 8 + cycle * 6 + Math.min(12, Math.floor(run.money / 100));
  const money = 20 + cycle * 18;
  return {
    cycle,
    chips,
    money,
    headline: `Cycle ${cycle} cleared`,
    detail: `+$${money} bank · +${chips} shop chips`,
  };
}

export function landShapeForSliceCount(count: number, harshFirst = false): number[] {
  const n = Math.max(6, count);
  const weights = Array.from({ length: n }, (_, i) => {
    const rank = harshFirst ? n - i : n - i;
    return Math.max(1, rank * (harshFirst && i < 3 ? 1.35 : 1));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / total) * 100);
  const floors = raw.map((r) => Math.floor(r));
  let rem = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (const { i } of order) {
    if (rem <= 0) break;
    out[i]! += 1;
    rem -= 1;
  }
  return out;
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
