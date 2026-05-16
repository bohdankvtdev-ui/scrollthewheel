import { SLICE_POOLS } from "./baseSlices";

/** Debuff slices from risk / corruption pools. */
export const DEBUFF_SLICE_IDS = ["r_debuff", "c_debuff", "c_curse", "x_debuff"] as const;

export function getDebuffSlicesFromPool(poolId: keyof typeof SLICE_POOLS) {
  return (SLICE_POOLS[poolId] ?? []).filter((s) => s.kind === "debuff");
}
