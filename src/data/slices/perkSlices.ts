import { SLICE_POOLS } from "./baseSlices";

/** Perk-offering slices across yield / preparation pools. */
export const PERK_SLICE_IDS = ["b_perk_tease", "y_perk", "s_expand", "s_shield", "p_perk"] as const;

export function getPerkSlicesFromPool(poolId: keyof typeof SLICE_POOLS) {
  return (SLICE_POOLS[poolId] ?? []).filter((s) => s.kind === "perk");
}
