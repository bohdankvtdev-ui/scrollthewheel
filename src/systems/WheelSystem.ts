import { getPipelineForFloor } from "../game/loop";

import { applyAdvancementsToSlices, getSliceCountForWheel } from "../game/advancements";
import { getConfiguredWheelSlices } from "../game/wheels/database";
import type { FloorWheelOrderId } from "../game/wheels/database/wheelDatabase";

import { SLICE_POOLS, type SlicePoolId } from "../game/prizes";

import type { ResolvedWheel, RunState, SliceCount, SliceDefinition, WheelDefinition } from "../schemas";

import { getSliceVisualTheme } from "../game/content/sliceVisualTheme";

import { getArchetypeForConfigId } from "../game/wheels/database";

import { sliceWheelCaption } from "../utils/sliceWheelCaption";

import { getEffectiveSliceCapacity } from "./PerkSystem";

import {

  getScalingParams,

  applyScalingToWheelDef,

  applyScalingToSliceWeight,

  resolveWheelDefinitionForIndex,

} from "./InfiniteScaling";



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

  const scaledDef = applyScalingToWheelDef(definition, params, wheelIndex, run);

  const capacity = getEffectiveSliceCapacity(run);

  let rawSlices: SliceDefinition[];



  if (scaledDef.wheelConfigId != null) {

    rawSlices = getConfiguredWheelSlices(scaledDef.wheelConfigId, scaledDef.id, {
      runId: run.runId,
      cycle: floor,
      ownedPerks: run.perks,
      advancements: run.advancements,
    });
    rawSlices = applyAdvancementsToSlices(
      rawSlices,
      scaledDef.wheelConfigId as FloorWheelOrderId,
      floor,
      run.advancements
    );

  } else {

    const pool = SLICE_POOLS[scaledDef.slicePoolId as SlicePoolId] ?? SLICE_POOLS.base ?? [];

    rawSlices = pickSlices(pool, scaledDef.sliceCount, capacity);

  }

  const sliceCount = rawSlices.length as SliceCount;

  const fromDatabase = scaledDef.wheelConfigId != null;

  const wheelArchetype =

    scaledDef.wheelConfigId != null ? getArchetypeForConfigId(scaledDef.wheelConfigId) : undefined;

  const slices = rawSlices.map((s, sliceIndex) => {

    const visual = getSliceVisualTheme(s.kind, s.weightTags, {
      sliceIndex,
      sliceCount,
      wheelArchetype,
    });

    return {

      ...s,

      baseWeight: fromDatabase ? s.baseWeight : applyScalingToSliceWeight(s, params),

      presentation: {

        ...s.presentation,

        colorIndex: sliceIndex,

        segmentColor: visual.segmentBg,

        iconColor: visual.iconColor,

        captionColor: visual.captionColor,

        chipColor: visual.chipBg,

      },

    };

  });

  const spinItems = slices.map((s, sliceIndex) => {

    const caption = sliceWheelCaption(s);

    const visual = getSliceVisualTheme(s.kind, s.weightTags, {
      sliceIndex,
      sliceCount,
      wheelArchetype,
    });

    return {

      id: s.id,

      label: s.label,

      shortLabel: caption,

      icon: s.icon,

      iconFamily: s.iconFamily,

      iconTint: visual.chipBg,

      iconChipBg: visual.chipBg,

      iconColor: visual.iconColor,

      captionColor: visual.captionColor,

      iconTone: visual.tone,

    };

  });

  return {

    definition: { ...scaledDef, sliceCount },

    slices,

    spinItems,

  };

}



export function buildFloorWheels(run: RunState): ResolvedWheel[] {

  const floor = run.floor;

  const count = getPipelineForFloor(floor).length;

  const wheels: ResolvedWheel[] = [];

  for (let i = 0; i < count; i++) {

    const def = resolveWheelDefinitionForIndex(run, i, floor);

    wheels.push(buildWheel(def, run, floor, i));

  }

  return wheels;

}



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
    if (w.definition.wheelConfigId != null) {
      const expected = getSliceCountForWheel(
        run.advancements,
        w.definition.wheelConfigId as FloorWheelOrderId
      );
      return w.slices.length !== expected;
    }
    return w.slices.length !== cap;
  });

  if (mismatch) return rebuildWheelsFromDatabase(run);



  if (run.wheels.length !== getPipelineForFloor(run.floor).length) {

    return rebuildWheelsFromDatabase(run);

  }



  return run;

}


