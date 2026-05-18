import type { RunState } from "../../schemas";
import { clampSliceCount } from "../../schemas/wheel.schema";
import type { WheelConfigId } from "./database/types";

export const STARTING_WEDGE_COUNT = 6;

/** Minimum wedges on a wheel after Wedge Laser (base wheels start at 6). */
export const LASER_MIN_SLICE_COUNT = 5;

/** Wedges permanently won from builder (+1 all wheels) — survives cycle scaling. */
export function getPermanentWedgeBonus(
  run: Pick<RunState, "permanentWedgeBonus" | "sliceCapacity">
): number {
  if (run.permanentWedgeBonus != null) return run.permanentWedgeBonus;
  const cap = run.sliceCapacity ?? STARTING_WEDGE_COUNT;
  return Math.max(0, cap - STARTING_WEDGE_COUNT);
}

/** Extra prize rows stacked on top of cycle baseline (builder wins, …). */
export function getCapacitySliceBonus(run: Pick<RunState, "sliceCapacity">): number {
  return getPermanentWedgeBonus(run);
}

/** Builder wheel always keeps six upgrade choices + one row per permanent bonus. */
export function getBuilderWheelSliceCount(run: Pick<RunState, "sliceCapacity">): number {
  return clampSliceCount(6 + getPermanentWedgeBonus(run));
}

export function getSliceCountForWheelWithBonus(
  _cycle: number,
  configId: WheelConfigId,
  wedgeBonus = 0
): number {
  if (configId === "wheel_7") {
    return clampSliceCount(STARTING_WEDGE_COUNT + wedgeBonus);
  }
  return clampSliceCount(STARTING_WEDGE_COUNT + wedgeBonus);
}

/** Preserve builder bonuses when advancing to the next cycle (no auto +1 per cycle). */
export function sliceCapacityForNextCycle(
  run: Pick<RunState, "permanentWedgeBonus" | "sliceCapacity" | "advancements">
): RunState["sliceCapacity"] {
  const wedgeBonus = getPermanentWedgeBonus(run);
  return clampSliceCount(STARTING_WEDGE_COUNT + wedgeBonus);
}

export function applySliceCountWithCapacity(
  baseCount: number,
  run: Pick<RunState, "floor" | "sliceCapacity" | "advancements">
): number {
  return clampSliceCount(baseCount + getCapacitySliceBonus(run));
}

/** After clearing the builder wheel, all later wheels use at least this many wedges. */
export const POST_BUILDER_MIN_SLICE_CAPACITY = 7 as const;

/** After builder: at least one permanent bonus wedge on every wheel (7+ on cycle 1). */
export function applyPostBuilderSliceFloor(run: RunState): RunState {
  if (run.wheelIndex < 7) return run;
  const bonus = Math.max(getPermanentWedgeBonus(run), 1);
  const cap = clampSliceCount(STARTING_WEDGE_COUNT + bonus) as RunState["sliceCapacity"];
  if (bonus === (run.permanentWedgeBonus ?? 0) && cap <= run.sliceCapacity) return run;
  return {
    ...run,
    permanentWedgeBonus: bonus,
    sliceCapacity: Math.max(run.sliceCapacity, cap) as RunState["sliceCapacity"],
    pendingWheelRebuild: true,
  };
}
