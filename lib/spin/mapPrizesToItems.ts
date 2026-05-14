import type { SpinWheelItem } from "../../types/spin";

export type PrizeSlice = { readonly id: string; readonly label: string };

/**
 * Maps domain prize rows to the third-party wheel contract. Throws if invalid (fail fast at boundary).
 */
export function mapPrizesToItems(slices: readonly PrizeSlice[]): SpinWheelItem[] {
  if (!slices?.length) {
    throw new Error("mapPrizesToItems: slices must be non-empty");
  }
  return slices.map((row, index) => {
    const id = String(row.id ?? "").trim();
    const label = String(row.label ?? "").trim();
    if (!id) {
      throw new Error(`mapPrizesToItems: missing id at index ${index}`);
    }
    if (!label) {
      throw new Error(`mapPrizesToItems: missing label for id "${id}"`);
    }
    return { id, label };
  });
}
