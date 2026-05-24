import type { SliceDefinition } from "../../schemas";
import { distributeLandChances } from "./database/prizeRng";

/** Re-normalize wedge land % to 100 after laser / insure removes slices. */
export function redistributeSliceLandWeights(
  slices: readonly SliceDefinition[]
): SliceDefinition[] {
  if (slices.length === 0) return [];
  const raw = slices.map((s) => Math.max(0, s.baseWeight));
  const total = raw.reduce((a, b) => a + b, 0);
  if (total <= 0) return slices.map((s) => ({ ...s }));
  const chances = distributeLandChances(raw);
  return slices.map((s, i) => ({ ...s, baseWeight: chances[i]! }));
}
