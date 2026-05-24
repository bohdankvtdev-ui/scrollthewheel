import type { InfiniteScalingParams } from "../schemas";

export const INFINITE_SCALING = {
  negativeWeightStep: 0.17,
  stakesMultStep: 0.13,
  moneyInflationStep: 0.045,
  /** Extra negative bias per wheel index within a floor (0–8) */
  wheelIndexNegativeStep: 0.035,
  sliceCapacityBonusFromFloor: 4,
  sliceCapacityBonus: 0,
} as const;

/** Ante labels — Balatro-style escalation. */
export function getBlindLabel(floor: number): string {
  const f = Math.max(1, floor);
  return `Cycle ${f}`;
}

export function getScalingParams(floor: number): InfiniteScalingParams {
  const f = Math.max(1, floor);
  const c = INFINITE_SCALING;
  return {
    floor: f,
    blindLabel: getBlindLabel(f),
    negativeWeightMult: 1 + (f - 1) * c.negativeWeightStep,
    stakesMult: 1 + (f - 1) * c.stakesMultStep,
    moneyInflationMult: 1 + (f - 1) * c.moneyInflationStep,
    sliceCapacityBonus: f >= c.sliceCapacityBonusFromFloor ? c.sliceCapacityBonus : 0,
  };
}
