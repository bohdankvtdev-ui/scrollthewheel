import type { SliceDefinition, WheelDefinition } from "../../../schemas";
import { getSliceCountForWheel } from "../../advancements/sliceCount";
import type { WheelConfigEntry, WheelConfigId, WheelPrizeSlot } from "./types";
import type { BossCycleAudit } from "../../boss/bossWheel";
import { FLOOR_WHEEL_ORDER, WHEEL_DATABASE, type FloorWheelOrderId } from "./wheelDatabase";
import { buildSlicesFromPrizes } from "./sliceFromPrize";
import {
  buildPrizeSlotsForWheel,
  type BuildWheelPrizeOptions,
} from "./wheelPrizeBuilder";

export { buildSliceFromPrizeSlot, buildSlicesFromPrizes } from "./sliceFromPrize";

export type WheelLayoutContext = BuildWheelPrizeOptions;

const VALIDATE_RUN_ID = "__validate__";

function normalizeLayoutContext(
  ctx?: number | WheelLayoutContext
): Required<WheelLayoutContext> {
  if (typeof ctx === "number") {
    return {
      runId: VALIDATE_RUN_ID,
      cycle: ctx,
      ownedPerks: [],
      advancements: [],
      banishedPrizes: [],
      permanentWedgeBonus: 0,
      wheelLaserCuts: {},
      wheelInsureCuts: {},
      bossCycleAudit: undefined,
    };
  }
  return {
    runId: ctx?.runId ?? VALIDATE_RUN_ID,
    cycle: ctx?.cycle ?? 1,
    ownedPerks: ctx?.ownedPerks ?? [],
    advancements: ctx?.advancements ?? [],
    banishedPrizes: ctx?.banishedPrizes ?? [],
    permanentWedgeBonus: ctx?.permanentWedgeBonus ?? 0,
    wheelLaserCuts: ctx?.wheelLaserCuts ?? {},
    wheelInsureCuts: ctx?.wheelInsureCuts ?? {},
    bossCycleAudit: ctx?.bossCycleAudit,
  };
}

export function getWheelConfig(configId: WheelConfigId): WheelConfigEntry {
  const entry = WHEEL_DATABASE[configId as FloorWheelOrderId];
  if (entry == null) {
    throw new Error(`Unknown wheel config "${configId}" — add it to wheelDatabase.ts`);
  }
  return entry;
}

/** Prize rows for a wheel — seeded per run + cycle; scales $/% in `buildSliceFromPrizeSlot`. */
export function getPrizeSlotsForWheel(
  configId: WheelConfigId,
  ctx?: number | WheelLayoutContext
): WheelPrizeSlot[] {
  const {
    runId,
    cycle,
    ownedPerks,
    advancements,
    banishedPrizes,
    permanentWedgeBonus,
    wheelLaserCuts,
    wheelInsureCuts,
    bossCycleAudit,
  } = normalizeLayoutContext(ctx);
  return buildPrizeSlotsForWheel(configId, {
    runId,
    cycle,
    ownedPerks,
    advancements,
    banishedPrizes,
    permanentWedgeBonus,
    wheelLaserCuts,
    wheelInsureCuts,
    bossCycleAudit,
  });
}

export type { BossCycleAudit };

/** Slices for a configured wheel (before floor scaling / capacity padding). */
export function getConfiguredWheelSlices(
  configId: WheelConfigId,
  instanceId: string,
  ctx?: number | WheelLayoutContext
): SliceDefinition[] {
  const { cycle } = normalizeLayoutContext(ctx);
  return buildSlicesFromPrizes(getPrizeSlotsForWheel(configId, ctx), instanceId, cycle);
}

export function wheelDefinitionFromConfig(configId: WheelConfigId, floor: number): WheelDefinition {
  const entry = getWheelConfig(configId);
  const f = Math.max(1, floor);
  const instanceId = f > 1 ? `${configId}_f${f}` : configId;
  return {
    id: instanceId,
    wheelConfigId: configId,
    role: entry.role,
    title: f > 1 ? `${entry.title} · F${f}` : entry.title,
    sliceCount: getSliceCountForWheel(f, [], configId as FloorWheelOrderId),
    slicePoolId: "config",
    physicsProfileId: entry.physicsProfileId ?? "default",
    modifiers: entry.modifiers,
  };
}

export function buildFloorDefinitionsFromDatabase(floor: number = 1): WheelDefinition[] {
  return FLOOR_WHEEL_ORDER.map((configId) => wheelDefinitionFromConfig(configId, floor));
}

export function getArchetypeForConfigId(configId: WheelConfigId) {
  return getWheelConfig(configId).archetype;
}

export function getArchetypeForWheelIndexFromDb(index: number) {
  const configId = FLOOR_WHEEL_ORDER[index];
  return configId != null ? getArchetypeForConfigId(configId) : null;
}

export { FLOOR_WHEEL_ORDER, WHEEL_DATABASE };
