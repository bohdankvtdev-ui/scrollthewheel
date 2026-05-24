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
import { redistributeSliceLandWeights } from "../game/wheels/sliceLandWeights";

import { sliceWheelCaption } from "../utils/sliceWheelCaption";

import { getEffectiveSliceCapacity } from "./PerkSystem";
import { getPermanentWedgeBonus } from "../game/wheels/sliceCapacityBonus";
import { summarizeCycleBeforeBoss } from "../game/boss/bossWheel";

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
  const chipBg = s.presentation?.chipColor ?? visual.chipBg;
  const iconColor = s.presentation?.iconColor ?? visual.iconColor;
  const captionColor = s.presentation?.captionColor ?? visual.captionColor;
  return {
    id: s.id,
    label: s.label,
    shortLabel: caption,
    icon: resolved.icon,
    iconFamily: resolved.iconFamily,
    iconTint: chipBg,
    iconChipBg: chipBg,
    iconColor,
    captionColor,
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
    const bossAudit =
      configKey === "wheel_9" && run.history.some((h) => h.floor === floor && h.wheelIndex < 8)
        ? summarizeCycleBeforeBoss(run, run.wheels)
        : undefined;
    rawSlices = getConfiguredWheelSlices(scaledDef.wheelConfigId, scaledDef.id, {
      runId: run.runId,
      cycle: floor,
      ownedPerks: run.perks,
      advancements: run.advancements,
      banishedPrizes: run.banishedPrizes?.[configKey] ?? [],
      permanentWedgeBonus: getPermanentWedgeBonus(run),
      wheelLaserCuts: run.wheelLaserCuts,
      wheelInsureCuts: run.wheelInsureCuts,
      bossCycleAudit: bossAudit,
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

  const balanced = redistributeSliceLandWeights(slices);
  const remapped = balanced.map((s, sliceIndex) => {
    const visual = getSliceVisualTheme(s.kind, s.weightTags, {
      sliceIndex,
      sliceCount,
      wheelArchetype,
    });
    const customSegment = s.presentation?.segmentColor;
    return {
      ...s,
      presentation: {
        ...s.presentation,
        colorIndex: sliceIndex,
        segmentColor: customSegment ?? visual.segmentBg,
        iconColor: customSegment != null ? (s.presentation?.iconColor ?? visual.iconColor) : visual.iconColor,
        captionColor:
          customSegment != null ? (s.presentation?.captionColor ?? visual.captionColor) : visual.captionColor,
        chipColor: customSegment != null ? (s.presentation?.chipColor ?? visual.chipBg) : visual.chipBg,
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



const BOSS_WHEEL_INDEX = 8;

/** Rebuild wheel 9 after wheels 1–8 — boss pool reacts to cycle history. */
export function rebuildBossWheelForRun(run: RunState): RunState {
  if (run.wheels.length <= BOSS_WHEEL_INDEX) return run;
  const def = resolveWheelDefinitionForIndex(run, BOSS_WHEEL_INDEX, run.floor);
  const wheels = [...run.wheels];
  wheels[BOSS_WHEEL_INDEX] = buildWheel(def, run, run.floor, BOSS_WHEEL_INDEX);
  return { ...run, wheels };
}

export function syncRunWheels(run: RunState): RunState {

  if (run.wheelDbRevision !== WHEEL_DATABASE_REVISION) {
    return { ...rebuildWheelsFromDatabase(run), wheelDbRevision: WHEEL_DATABASE_REVISION };
  }

  if (run.pendingWheelRebuild) {
    return syncRunWheels({
      ...remapWheelsAfterCapacityChange(run),
      pendingWheelRebuild: false,
    });
  }

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
      const bossAudit =
        configId === "wheel_9" &&
        run.history.some((h) => h.floor === run.floor && h.wheelIndex < BOSS_WHEEL_INDEX)
          ? summarizeCycleBeforeBoss(run, run.wheels)
          : undefined;
      const raw = getConfiguredWheelSlices(configId, w.definition.id, {
        runId: run.runId,
        cycle: run.floor,
        ownedPerks: run.perks,
        advancements: run.advancements,
        banishedPrizes: run.banishedPrizes?.[configId] ?? [],
        permanentWedgeBonus: getPermanentWedgeBonus(run),
        wheelLaserCuts: run.wheelLaserCuts,
        wheelInsureCuts: run.wheelInsureCuts,
        bossCycleAudit: bossAudit,
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


