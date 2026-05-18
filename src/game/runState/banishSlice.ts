import type { FloorWheelOrderId } from "../wheels/database/wheelDatabase";
import { catalogPrizeIdFromSliceId } from "../wheels/database/slicePrizeId";
import type { RunState } from "./types";
import { useWedgeEraser } from "../shop/consumables";
import { rebuildWheelsFromDatabase } from "../../systems/WheelSystem";

/** Banish a prize from the current wheel layout (consumes one Wedge Eraser). */
export function banishSliceOnWheel(
  run: RunState,
  wheelIndex: number,
  sliceIndex: number
): { ok: true; run: RunState } | { ok: false; reason: string } {
  const wheel = run.wheels[wheelIndex];
  const configId = wheel?.definition.wheelConfigId as FloorWheelOrderId | undefined;
  const slice = wheel?.slices[sliceIndex];
  if (configId == null || slice == null) {
    return { ok: false, reason: "Invalid wedge" };
  }
  if (wheelIndex !== run.wheelIndex) {
    return { ok: false, reason: "Can only edit the current wheel" };
  }

  const catalogPrize = inferCatalogPrizeId(slice);
  const existing = run.banishedPrizes?.[configId] ?? [];
  if (existing.includes(catalogPrize)) {
    return { ok: false, reason: "Already removed" };
  }

  const afterEraser = useWedgeEraser(run);
  if (afterEraser == null) return { ok: false, reason: "No Wedge Eraser in inventory" };
  const banishedPrizes = {
    ...(afterEraser.banishedPrizes ?? {}),
    [configId]: [...existing, catalogPrize],
  };

  const next = rebuildWheelsFromDatabase({
    ...afterEraser,
    banishedPrizes,
    pendingWheelRebuild: false,
  });

  return { ok: true, run: next };
}

function inferCatalogPrizeId(slice: { id: string; payload: Record<string, unknown> }): string {
  const fromId = catalogPrizeIdFromSliceId(slice.id);
  if (fromId != null) return fromId;
  if (slice.payload.runEffectId != null) return String(slice.payload.runEffectId);
  if (slice.payload.perkId != null) return `perk_${slice.payload.perkId}`;
  if (slice.payload.relicId != null) return "boss_relic_crown";
  return slice.id;
}
