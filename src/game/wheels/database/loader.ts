import type { SliceDefinition, SliceCount, WheelDefinition } from "../../../schemas";
import { MIN_SLICE_COUNT, MAX_SLICE_COUNT } from "../../../schemas/wheel.schema";
import { getSliceCountForWheel } from "../../advancements/sliceCount";
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { PrizeDef, WheelConfigEntry, WheelConfigId, WheelPrizeSlot } from "./types";
import { resolvePrizeIcon } from "../../content/prizeIcons";
import {
  buildPrizeSlotsForWheel,
  finalizeSlicePayload,
  type BuildWheelPrizeOptions,
} from "./wheelPrizeBuilder";
import { FLOOR_WHEEL_ORDER, WHEEL_DATABASE, type FloorWheelOrderId } from "./wheelDatabase";

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
  };
}

function assertPrize(prizeId: string): void {
  if (PRIZE_CATALOG[prizeId as PrizeCatalogId] == null) {
    throw new Error(`Unknown prize "${prizeId}" — add it to prizeCatalog.ts`);
  }
}

export function buildSliceFromPrizeSlot(
  slot: WheelPrizeSlot,
  wheelId: string,
  index: number,
  cycle: number = 1
): SliceDefinition {
  assertPrize(slot.prize);
  const template = PRIZE_CATALOG[slot.prize as PrizeCatalogId] as PrizeDef;
  const { payload, label } = finalizeSlicePayload(
    { ...template.payload } as Record<string, unknown>,
    template.kind,
    template.label,
    cycle
  );
  const { icon, iconFamily } = resolvePrizeIcon(slot.prize, template, { wheelId });
  return {
    id: `${wheelId}_${slot.prize}_${index}`,
    kind: template.kind,
    label,
    icon,
    iconFamily,
    baseWeight: slot.chance,
    weightTags: template.weightTags ? [...template.weightTags] : undefined,
    payload: payload as PrizeDef["payload"],
    presentation: template.presentation ? { ...template.presentation } : undefined,
  };
}

/**
 * Every prize row → one visible slice. `chance` becomes spin weight (land %).
 * Rows with chance 0 still appear on the wheel but never win.
 */
export function buildSlicesFromPrizes(
  prizes: WheelPrizeSlot[],
  wheelId: string,
  cycle: number = 1
): SliceDefinition[] {
  if (prizes.length < MIN_SLICE_COUNT || prizes.length > MAX_SLICE_COUNT) {
    throw new Error(
      `Wheel "${wheelId}" must have ${MIN_SLICE_COUNT}–${MAX_SLICE_COUNT} prizes (got ${prizes.length})`
    );
  }
  const hasWinner = prizes.some((slot) => slot.chance > 0);
  if (!hasWinner) {
    throw new Error(`Wheel "${wheelId}" needs at least one prize with chance > 0`);
  }
  return prizes.map((slot, index) => buildSliceFromPrizeSlot(slot, wheelId, index, cycle));
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
  });
}

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
