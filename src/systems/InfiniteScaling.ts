import type { InfiniteScalingParams, RunState, SliceDefinition, WheelDefinition } from "../schemas";
import { getWheelDifficultyBias } from "../game/gdd";
import {
  applySliceCapacityFromScaling,
  getBlindQuotaForRun,
  getScalingParams,
  INFINITE_SCALING,
} from "../game/loop";

export { getScalingParams, INFINITE_SCALING };

export function applyScalingToRun(run: RunState, floor: number): RunState {
  const params = getScalingParams(floor);
  const capacity = applySliceCapacityFromScaling(run.sliceCapacity, params);
  const blindQuota = getBlindQuotaForRun(floor, run.perks);
  return { ...run, floor, sliceCapacity: capacity, blindQuota };
}

export function applyScalingToWheelDef(
  wheel: WheelDefinition,
  params: InfiniteScalingParams,
  wheelIndex: number = 0
): WheelDefinition {
  const bias = getWheelDifficultyBias(wheelIndex, params.floor);
  const floorStakes = (params.floor - 1) * 0.025;
  const mod = wheel.modifiers ?? {};
  return {
    ...wheel,
    modifiers: {
      ...mod,
      forceNegativeBias: (mod.forceNegativeBias ?? 0) + bias,
      stakesBoost: (mod.stakesBoost ?? 0) + floorStakes,
    },
  };
}

export function applyScalingToSliceWeight(
  slice: SliceDefinition,
  params: InfiniteScalingParams
): number {
  let w = slice.baseWeight;
  if (slice.weightTags?.includes("negative")) w *= params.negativeWeightMult;
  if (slice.weightTags?.includes("stakes")) w *= params.stakesMult;
  if (
    slice.weightTags?.includes("positive") &&
    slice.payload.moneyDelta != null &&
    slice.payload.moneyDelta > 0
  ) {
    w *= params.moneyInflationMult;
  }
  return w;
}
