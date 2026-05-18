import { patchResolvedWheelSlices } from "../../systems/WheelSystem";
import type { ResolvedWheel, RunState, SliceDefinition } from "../../schemas";
import { LASER_MIN_SLICE_COUNT } from "../wheels/sliceCapacityBonus";

export { LASER_MIN_SLICE_COUNT };

function isNegativeSlice(slice: SliceDefinition): boolean {
  if (slice.weightTags?.includes("negative")) return true;
  if (slice.kind === "money_loss" || slice.kind === "bank_cut" || slice.kind === "bank_wipe") {
    return true;
  }
  if ((slice.payload.moneyDelta ?? 0) < 0) return true;
  if (slice.payload.bankPercent != null && slice.payload.bankPercent < 0) return true;
  return false;
}

/** Remove the highest land-% negative wedge from a wheel (Insure tactic). */
export function stripWorstNegativeSlice(wheel: ResolvedWheel): ResolvedWheel {
  if (wheel.slices.length <= LASER_MIN_SLICE_COUNT) return wheel;

  let worstIndex = -1;
  let worstWeight = -1;
  for (let i = 0; i < wheel.slices.length; i++) {
    const s = wheel.slices[i]!;
    if (!isNegativeSlice(s)) continue;
    if (s.baseWeight > worstWeight) {
      worstWeight = s.baseWeight;
      worstIndex = i;
    }
  }
  if (worstIndex < 0) return wheel;

  const nextSlices = wheel.slices.filter((_, i) => i !== worstIndex);
  return patchResolvedWheelSlices(wheel, nextSlices);
}

export function canStripWorstNegativeFromWheel(wheel: ResolvedWheel): boolean {
  if (wheel.slices.length <= LASER_MIN_SLICE_COUNT) return false;
  return wheel.slices.some(isNegativeSlice);
}

export function canInsureNextWheel(run: RunState, fromWheelIndex: number): boolean {
  const nextIdx = fromWheelIndex + 1;
  if (nextIdx >= run.wheels.length) return false;
  const wheel = run.wheels[nextIdx];
  if (wheel == null) return false;
  return canStripWorstNegativeFromWheel(wheel);
}

/** Strip worst negative on `wheelIndex` and record cut so sync/rebuild keeps wedge count. */
export function applyInsuredWheelOnIndex(run: RunState, wheelIndex: number): RunState {
  const wheel = run.wheels[wheelIndex];
  if (wheel == null) return run;

  const patched = stripWorstNegativeSlice(wheel);
  const configId = wheel.definition.wheelConfigId;
  const stripped = patched.slices.length < wheel.slices.length;

  if (!stripped) {
    return {
      ...run,
      runEffects: { ...run.runEffects, insureNextWheel: false },
    };
  }

  const wheels = run.wheels.map((w, i) => (i === wheelIndex ? patched : w));
  const wheelInsureCuts =
    configId != null
      ? {
          ...(run.wheelInsureCuts ?? {}),
          [configId]: (run.wheelInsureCuts?.[configId] ?? 0) + 1,
        }
      : run.wheelInsureCuts;

  return {
    ...run,
    wheels,
    wheelInsureCuts,
    runEffects: { ...run.runEffects, insureNextWheel: false },
  };
}
