import { getPipelineForFloor } from "../game/loop";

import { applyAdvancementsToSlices } from "../game/advancements";
import { getConfiguredWheelSlices } from "../game/wheels/database";
import {
  WHEEL_DATABASE_REVISION,
  type FloorWheelOrderId,
} from "../game/wheels/database/wheelDatabase";

import { SLICE_POOLS, type SlicePoolId } from "../game/prizes";

import type { ResolvedWheel, RunState, SliceCount, SliceDefinition, WheelDefinition } from "../schemas";
import { clampSliceCount } from "../schemas/wheel.schema";

import { getSliceVisualTheme } from "../game/content/sliceVisualTheme";
import { resolveSliceIcon } from "../game/content/resolveIcon";

import { getArchetypeForConfigId } from "../game/wheels/database";

import { sliceWheelCaption } from "../utils/sliceWheelCaption";

import { getEffectiveSliceCapacity } from "./PerkSystem";
import { getPermanentWedgeBonus } from "../game/wheels/sliceCapacityBonus";

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

function buildSpinItemFromSlice(
  s: SliceDefinition,
  sliceIndex: number,
  sliceCount: SliceCount,
  wheelArchetype?: ReturnType<typeof getArchetypeForConfigId>
) {
  const caption = sliceWheelCaption(s);
  const visual = getSliceVisualTheme(s.kind, s.weightTags, {
    sliceIndex,
    sliceCount,
    wheelArchetype,
  });
  const resolved = resolveSliceIcon(s);
  return {
    id: s.id,
    label: s.label,
    shortLabel: caption,
    icon: resolved.icon,
    iconFamily: resolved.iconFamily,
    iconTint: visual.chipBg,
    iconChipBg: visual.chipBg,
    iconColor: visual.iconColor,
    captionColor: visual.captionColor,
    iconTone: visual.tone,
  };
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

    const configKey = scaledDef.wheelConfigId as FloorWheelOrderId;
    rawSlices = getConfiguredWheelSlices(scaledDef.wheelConfigId, scaledDef.id, {
      runId: run.runId,
      cycle: floor,
      ownedPerks: run.perks,
      advancements: run.advancements,
      banishedPrizes: run.banishedPrizes?.[configKey] ?? [],
      permanentWedgeBonus: getPermanentWedgeBonus(run),
      wheelLaserCuts: run.wheelLaserCuts,
      wheelInsureCuts: run.wheelInsureCuts,
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

  const spinItems = slices.map((s, sliceIndex) =>
    buildSpinItemFromSlice(s, sliceIndex, sliceCount, wheelArchetype)
  );

  return {

    definition: { ...scaledDef, sliceCount },

    slices,

    spinItems,

  };

}

/** Rebuild spin items + colors after a wedge is lasered off in-run. */
export function patchResolvedWheelSlices(
  wheel: ResolvedWheel,
  slices: SliceDefinition[]
): ResolvedWheel {
  const sliceCount = clampSliceCount(slices.length);
  const wheelArchetype =
    wheel.definition.wheelConfigId != null
      ? getArchetypeForConfigId(wheel.definition.wheelConfigId)
      : undefined;

  const remapped = slices.map((s, sliceIndex) => {
    const visual = getSliceVisualTheme(s.kind, s.weightTags, {
      sliceIndex,
      sliceCount,
      wheelArchetype,
    });
    return {
      ...s,
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

  const spinItems = remapped.map((s, sliceIndex) =>
    buildSpinItemFromSlice(s, sliceIndex, sliceCount, wheelArchetype)
  );

  return {
    definition: { ...wheel.definition, sliceCount },
    slices: remapped,
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

  if (run.wheelDbRevision !== WHEEL_DATABASE_REVISION) {
    return { ...rebuildWheelsFromDatabase(run), wheelDbRevision: WHEEL_DATABASE_REVISION };
  }

  if (run.pendingWheelRebuild) return rebuildWheelsFromDatabase(run);

  if (run.wheels.length === 0) return rebuildWheelsFromDatabase(run);



  const usesDatabase = run.wheels.some((w) => w.definition.wheelConfigId != null);

  const staleDatabase = usesDatabase && run.wheels.some((w) => w.definition.wheelConfigId == null);

  if (staleDatabase || !usesDatabase) {

    return rebuildWheelsFromDatabase(run);

  }



  const cap = getEffectiveSliceCapacity(run);

  const mismatch = run.wheels.some((w, i) => {
    if (w.definition.wheelConfigId != null) {
      const configId = w.definition.wheelConfigId as FloorWheelOrderId;
      const raw = getConfiguredWheelSlices(configId, w.definition.id, {
        runId: run.runId,
        cycle: run.floor,
        ownedPerks: run.perks,
        advancements: run.advancements,
        banishedPrizes: run.banishedPrizes?.[configId] ?? [],
        permanentWedgeBonus: getPermanentWedgeBonus(run),
        wheelLaserCuts: run.wheelLaserCuts,
        wheelInsureCuts: run.wheelInsureCuts,
      });
      const expected = applyAdvancementsToSlices(
        raw,
        configId,
        run.floor,
        run.advancements ?? []
      ).length;
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


