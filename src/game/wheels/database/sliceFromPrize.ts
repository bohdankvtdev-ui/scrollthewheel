import type { SliceDefinition } from "../../../schemas";
import { MIN_SLICE_COUNT, MAX_SLICE_COUNT } from "../../../schemas/wheel.schema";
import { resolvePrizeIcon } from "../../content/prizeIcons";
import type { WheelArchetype } from "../types";
import {
  applyCycleEconomyToPayload,
  formatPrizeLabel,
  type CycleEconomyContext,
} from "./cycleEconomy";
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { PrizeDef, WheelPrizeSlot } from "./types";
import { WHEEL_DATABASE, type FloorWheelOrderId } from "./wheelDatabase";

function assertPrize(prizeId: string): void {
  if (PRIZE_CATALOG[prizeId as PrizeCatalogId] == null) {
    throw new Error(`Unknown prize "${prizeId}" — add it to prizeCatalog.ts`);
  }
}

function economyContextForWheel(wheelId: string): CycleEconomyContext {
  const configId = wheelId.match(/^(wheel_\d+)/)?.[1] as FloorWheelOrderId | undefined;
  const entry = configId != null ? WHEEL_DATABASE[configId] : undefined;
  return {
    configId,
    archetype: entry?.archetype as WheelArchetype | undefined,
  };
}

export function finalizeSlicePayload(
  templatePayload: Record<string, unknown>,
  kind: string,
  label: string,
  cycle: number,
  wheelId?: string
): { payload: Record<string, unknown>; label: string } {
  const ctx = wheelId != null ? economyContextForWheel(wheelId) : {};
  const payload = applyCycleEconomyToPayload(templatePayload, kind, cycle, ctx);
  return {
    payload,
    label: formatPrizeLabel(kind, payload as Parameters<typeof formatPrizeLabel>[1], label),
  };
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
    cycle,
    wheelId
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

/** Every prize row → one visible slice. `chance` becomes spin weight (land %). */
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
