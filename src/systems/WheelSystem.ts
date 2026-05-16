import { getPipelineForFloor } from "../game/loop";
import { getConfiguredWheelSlices } from "../game/wheels/database";
import { SLICE_POOLS, type SlicePoolId } from "../game/prizes";
import type { ResolvedWheel, RunState, SliceCount, SliceDefinition, WheelDefinition } from "../schemas";
import { sliceAccentForKind } from "../utils/sliceAccent";
import { sliceWheelCaption } from "../utils/sliceWheelCaption";
import { getEffectiveSliceCapacity } from "./PerkSystem";
import { getScalingParams, applyScalingToWheelDef, applyScalingToSliceWeight } from "./InfiniteScaling";

function pickSlices(
  pool: SliceDefinition[],
  defSliceCount: number,
  capacity: SliceCount
): SliceDefinition[] {
  const target = Math.max(defSliceCount, capacity);
  const fromPool = pool.slice(0, Math.min(target, pool.length));
  if (fromPool.length >= target) return fromPool;
  const expansion = SLICE_POOLS.expansion ?? [];
  const needed = target - fromPool.length;
  return [...fromPool, ...expansion.slice(0, needed)];
}

export function buildWheel(
  definition: WheelDefinition,
  run: RunState,
  scalingFloor?: number,
  wheelIndex: number = 0
): ResolvedWheel {
  const floor = scalingFloor ?? run.floor;
  const params = getScalingParams(floor);
  const scaledDef = applyScalingToWheelDef(definition, params, wheelIndex);
  const capacity = getEffectiveSliceCapacity(run);
  let rawSlices: SliceDefinition[];

  if (scaledDef.wheelConfigId != null) {
    // Database wheels: exact slices from wheelDatabase.ts — no padding or starter override.
    rawSlices = getConfiguredWheelSlices(scaledDef.wheelConfigId, scaledDef.id);
  } else {
    const pool = SLICE_POOLS[scaledDef.slicePoolId as SlicePoolId] ?? SLICE_POOLS.base ?? [];
    rawSlices = pickSlices(pool, scaledDef.sliceCount, capacity);
  }
  const sliceCount = rawSlices.length as SliceCount;
  const fromDatabase = scaledDef.wheelConfigId != null;
  const slices = rawSlices.map((s) => ({
    ...s,
    // DB `chance` % is the testable land rate; joker/debuff mods apply at spin time only.
    baseWeight: fromDatabase ? s.baseWeight : applyScalingToSliceWeight(s, params),
  }));
  const spinItems = slices.map((s, i) => {
    const caption = sliceWheelCaption(s);
    return {
      id: s.id,
      label: s.label,
      shortLabel: caption,
      icon: s.icon,
      iconFamily: s.iconFamily,
      iconTint: sliceAccentForKind(s.kind, i),
    };
  });
  return {
    definition: { ...scaledDef, sliceCount },
    slices,
    spinItems,
  };
}

export function buildFloorWheels(run: RunState): ResolvedWheel[] {
  const pipeline = getPipelineForFloor(run.floor);
  return pipeline.map((def, i) => buildWheel(def, run, run.floor, i));
}

/** Rebuild every wheel from `wheelDatabase.ts` (call after DB edits or on load). */
export function rebuildWheelsFromDatabase(run: RunState): RunState {
  return { ...run, wheels: buildFloorWheels(run) };
}

export function expandSliceCapacity(run: RunState, toCount: SliceCount): RunState {
  if (toCount <= run.sliceCapacity) return run;
  return { ...run, sliceCapacity: toCount };
}

export function remapWheelsAfterCapacityChange(run: RunState): RunState {
  return { ...run, wheels: buildFloorWheels(run) };
}

/** Rebuild wheels when empty, stale DB revision, or legacy capacity mismatch. */
export function syncRunWheels(run: RunState): RunState {
  if (run.pendingWheelRebuild) return rebuildWheelsFromDatabase(run);
  if (run.wheels.length === 0) return rebuildWheelsFromDatabase(run);

  const usesDatabase = run.wheels.some((w) => w.definition.wheelConfigId != null);
  const staleDatabase = usesDatabase && run.wheels.some((w) => w.definition.wheelConfigId == null);
  if (staleDatabase || !usesDatabase) {
    return rebuildWheelsFromDatabase(run);
  }

  const cap = getEffectiveSliceCapacity(run);
  const mismatch = run.wheels.some((w) => {
    if (w.definition.wheelConfigId != null) return false;
    return w.slices.length !== cap;
  });
  if (mismatch) return rebuildWheelsFromDatabase(run);

  return run;
}
