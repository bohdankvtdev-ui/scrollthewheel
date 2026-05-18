import type { SliceCount } from "../../schemas";
import { clampSliceCount } from "../../schemas/wheel.schema";
import { getSliceCountForCycle } from "../cycle/cycleProgression";
import { FLOOR_WHEEL_ORDER } from "../wheels/database/wheelDatabase";
import type { WheelConfigId } from "../wheels/database/types";
import { hasAdvancement } from "./advancementCatalog";

export const BASE_SLICES_PER_WHEEL = 6;

/** Extra wedges from advancements on a given wheel (0–3). */
export function getExtraSlicesForWheel(
  advancements: string[] = [],
  wheelConfigId: WheelConfigId
): number {
  let extra = 0;
  if (hasAdvancement({ advancements }, "money_on_all") && wheelConfigId !== "wheel_1") {
    extra += 1;
  }
  if (hasAdvancement({ advancements }, "perk_on_all") && wheelConfigId !== "wheel_4") {
    extra += 1;
  }
  if (hasAdvancement({ advancements }, "percent_drip") && wheelConfigId !== "wheel_2") {
    extra += 1;
  }
  return extra;
}

/** Base wedge count from cycle scaling; advancement injects add slices separately in `applyAdvancementsToSlices`. */
export function getSliceCountForWheel(
  cycle: number,
  _advancements: string[] = [],
  _wheelConfigId: WheelConfigId
): number {
  return clampSliceCount(getSliceCountForCycle(cycle));
}

/** Run-wide max wedge count (cycle scaling + advancement injects). */
export function getRunMaxSliceCount(cycle: number, advancements: string[] = []): SliceCount {
  const base = getSliceCountForCycle(cycle);
  const max = Math.max(
    BASE_SLICES_PER_WHEEL,
    ...FLOOR_WHEEL_ORDER.map((id) => base + getExtraSlicesForWheel(advancements, id))
  );
  return clampSliceCount(max);
}
