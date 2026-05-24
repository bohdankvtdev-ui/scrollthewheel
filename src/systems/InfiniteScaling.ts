import type { InfiniteScalingParams, RunState, SliceDefinition, WheelDefinition } from "../schemas";
import { getCycleParams, getWheelDifficultyBias, getConfigIdForArchetype } from "../game/gdd";
import { getScalingParams, INFINITE_SCALING } from "../game/infiniteScalingConfig";
import { applySliceCapacityFromScaling } from "../game/loop";
import {
  buildFloorDefinitionsFromDatabase,
  wheelDefinitionFromConfig,
} from "../game/wheels/database/loader";

export { getScalingParams, INFINITE_SCALING };

export function applyScalingToRun(run: RunState, floor: number): RunState {
  const params = getScalingParams(floor);
  const capacity = applySliceCapacityFromScaling(run.sliceCapacity, params);
  return { ...run, floor, sliceCapacity: capacity };
}

export function applyScalingToWheelDef(
  wheel: WheelDefinition,
  params: InfiniteScalingParams,
  wheelIndex: number = 0,
  run?: RunState
): WheelDefinition {
  const cycle = getCycleParams(params.floor);
  const bias = getWheelDifficultyBias(wheelIndex, params.floor);
  const floorStakes = (params.floor - 1) * 0.025;
  const mod = wheel.modifiers ?? {};
  const fxBias = run?.runEffects?.negativeBiasBonus ?? 0;
  const corruptionBias = (run?.runEffects?.corruptionRemainingWheels ?? 0) > 0 ? 0.1 : 0;
  const doomBias = (run?.runEffects?.doomSpiralRemainingWheels ?? 0) > 0 ? 0.15 : 0;

  let forceNegative =
    (mod.forceNegativeBias ?? 0) +
    bias +
    cycle.globalNegativeBias +
    fxBias +
    corruptionBias +
    doomBias;

  if (cycle.riskWheelIndices.includes(wheelIndex)) {
    forceNegative += 0.08;
  }

  if (cycle.doubleBossWheel && wheel.role === "boss") {
    forceNegative += 0.1;
  }
  if (wheel.role === "boss" && run != null) {
    const perks = run.perks?.length ?? 0;
    forceNegative += Math.min(0.12, perks * 0.025);
  }

  return {
    ...wheel,
    modifiers: {
      ...mod,
      forceNegativeBias: forceNegative,
      stakesBoost: (mod.stakesBoost ?? 0) + floorStakes,
    },
  };
}

export function applyScalingToSliceWeight(
  slice: SliceDefinition,
  params: InfiniteScalingParams
): number {
  const cycle = getCycleParams(params.floor);
  let w = slice.baseWeight;
  if (slice.weightTags?.includes("negative")) {
    w *= params.negativeWeightMult * (1 + cycle.negativeSliceInject * 0.04);
  }
  if (slice.weightTags?.includes("stakes")) w *= params.stakesMult;
  if (
    slice.weightTags?.includes("positive") &&
    slice.payload.moneyDelta != null &&
    slice.payload.moneyDelta > 0
  ) {
    w *= params.moneyInflationMult;
  }
  if (slice.weightTags?.includes("rare")) {
    w *= cycle.luckyWeightMult;
  }
  return w;
}

export function resolveWheelDefinitionForIndex(
  run: RunState,
  index: number,
  floor: number
): WheelDefinition {
  const forcedId = run.runEffects?.forcedArchetypeByIndex?.[index];
  if (forcedId != null) {
    return wheelDefinitionFromConfig(forcedId, floor);
  }

  const cycle = getCycleParams(floor);
  if (cycle.riskWheelIndices.includes(index)) {
    const riskId = getConfigIdForArchetype("risk");
    if (riskId != null) {
      return wheelDefinitionFromConfig(riskId, floor);
    }
  }

  const pipeline = buildFloorDefinitionsFromDatabase(floor);
  return pipeline[index] ?? pipeline[0]!;
}