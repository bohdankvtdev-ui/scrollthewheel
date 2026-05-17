import type { SliceCount } from "../../schemas";
import { FLOOR_WHEEL_ORDER } from "../wheels/database/wheelDatabase";
import type { WheelConfigId } from "../wheels/database/types";
import { hasAdvancement } from "./advancementCatalog";

export const BASE_SLICES_PER_WHEEL = 6;

/** Extra wedges added by advancements on a given wheel (0–3). */
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

export function getSliceCountForWheel(
  advancements: string[] = [],
  wheelConfigId: WheelConfigId
): number {
  return BASE_SLICES_PER_WHEEL + getExtraSlicesForWheel(advancements, wheelConfigId);
}

/** Run-wide max wedge count (drives wheel renderer + sliceCapacity). */
export function getRunMaxSliceCount(advancements: string[] = []): SliceCount {
  const max = Math.max(
    BASE_SLICES_PER_WHEEL,
    ...FLOOR_WHEEL_ORDER.map((id) => getSliceCountForWheel(advancements, id))
  );
  const allowed: SliceCount[] = [6, 7, 8, 9, 10, 12];
  const picked = allowed.filter((n) => n >= max).sort((a, b) => a - b)[0];
  return (picked ?? 12) as SliceCount;
}
