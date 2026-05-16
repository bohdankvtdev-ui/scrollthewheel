import type { SliceDefinition, SliceCount, WheelDefinition } from "../../../schemas";

function sliceCountFromPrizeCount(count: number): SliceCount {
  if (count <= 6) return 6;
  if (count <= 8) return 8;
  if (count <= 10) return 10;
  return 12;
}
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { PrizeDef, WheelConfigEntry, WheelConfigId, WheelPrizeSlot } from "./types";
import { FLOOR_WHEEL_ORDER, WHEEL_DATABASE, type FloorWheelOrderId } from "./wheelDatabase";

function assertPrize(prizeId: string): void {
  if (PRIZE_CATALOG[prizeId as PrizeCatalogId] == null) {
    throw new Error(`Unknown prize "${prizeId}" — add it to prizeCatalog.ts`);
  }
}

export function buildSliceFromPrizeSlot(
  slot: WheelPrizeSlot,
  wheelId: string,
  index: number
): SliceDefinition {
  assertPrize(slot.prize);
  const template = PRIZE_CATALOG[slot.prize as PrizeCatalogId] as PrizeDef;
  return {
    id: `${wheelId}_${slot.prize}_${index}`,
    kind: template.kind,
    label: template.label,
    icon: template.icon,
    iconFamily: template.iconFamily,
    baseWeight: slot.chance,
    weightTags: template.weightTags ? [...template.weightTags] : undefined,
    payload: { ...template.payload },
    presentation: template.presentation ? { ...template.presentation } : undefined,
  };
}

/**
 * Every prize row → one visible slice. `chance` becomes spin weight (land %).
 * Rows with chance 0 still appear on the wheel but never win.
 */
export function buildSlicesFromPrizes(
  prizes: WheelPrizeSlot[],
  wheelId: string
): SliceDefinition[] {
  if (prizes.length === 0) {
    throw new Error(`Wheel "${wheelId}" has no prizes — add rows in wheelDatabase.ts`);
  }
  const hasWinner = prizes.some((slot) => slot.chance > 0);
  if (!hasWinner) {
    throw new Error(`Wheel "${wheelId}" needs at least one prize with chance > 0`);
  }
  return prizes.map((slot, index) => buildSliceFromPrizeSlot(slot, wheelId, index));
}

export function getWheelConfig(configId: WheelConfigId): WheelConfigEntry {
  const entry = WHEEL_DATABASE[configId as FloorWheelOrderId];
  if (entry == null) {
    throw new Error(`Unknown wheel config "${configId}" — add it to wheelDatabase.ts`);
  }
  return entry;
}

/** Slices for a configured wheel (before floor scaling / capacity padding). */
export function getConfiguredWheelSlices(configId: WheelConfigId, instanceId: string): SliceDefinition[] {
  const entry = getWheelConfig(configId);
  return buildSlicesFromPrizes(entry.prizes, instanceId);
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
    sliceCount: sliceCountFromPrizeCount(entry.prizes.length),
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
