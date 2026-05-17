import type { SliceDefinition } from "../schemas";
import { getSliceProbabilities } from "../systems/ProbabilityResolver";
import type { ResolveContext } from "../systems/types";

/** True land % for one wedge (matches spin resolver). */
export function getSliceLandChancePercent(
  slice: SliceDefinition,
  allSlices: readonly SliceDefinition[],
  ctx: ResolveContext
): number {
  if (allSlices.length === 0) return slice.baseWeight;
  const row = getSliceProbabilities(allSlices, ctx).find((r) => r.id === slice.id);
  return row != null ? row.probability * 100 : slice.baseWeight;
}

/** Player-facing label — shows effective %; notes perk boost when it differs from base. */
export function formatSliceLandChance(
  slice: SliceDefinition,
  allSlices: readonly SliceDefinition[],
  ctx?: ResolveContext
): string {
  if (slice.baseWeight <= 0) return "Never wins";

  if (ctx == null || allSlices.length === 0) {
    return `${slice.baseWeight.toFixed(1)}% land chance`;
  }

  const effective = getSliceLandChancePercent(slice, allSlices, ctx);
  const boosted = Math.abs(effective - slice.baseWeight) > 0.15;

  if (boosted) {
    return `${effective.toFixed(1)}% land (${slice.baseWeight.toFixed(1)}% on wheel)`;
  }
  return `${effective.toFixed(1)}% land chance`;
}

/** All wedge land % for this spin context — probabilities sum to 100%. */
export function getWheelLandChanceTable(
  slices: readonly SliceDefinition[],
  ctx: ResolveContext
): Map<string, number> {
  return new Map(
    getSliceProbabilities(slices, ctx).map((r) => [r.id, r.probability * 100])
  );
}
