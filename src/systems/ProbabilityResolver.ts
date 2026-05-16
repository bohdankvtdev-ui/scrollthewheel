/**
 * Spin outcome weights — used when the wheel stops (not visual spin physics).
 *
 * 1. Slice pools: `game/prizes.ts` — each slice has `baseWeight` + `weightTags`
 * 2. Wheel build: `WheelSystem` bakes floor scaling into `baseWeight`
 * 3. Spin pick: `buildResolveContext` + `buildWeightedSlices` + `pickWeightedIndex`
 * 4. Apply prize: `wheelResolver` / `PerkSystem.applyMoneyDelta` (payout perks)
 */
import type { ResolveContext } from "./types";
import type { SliceDefinition, WeightedSlice } from "../schemas";
import { pickWeightedIndex } from "../utils/weightedPick";

export type SliceProbability = {
  id: string;
  label: string;
  kind: SliceDefinition["kind"];
  effectiveWeight: number;
  /** 0–1 chance for this slice on one spin */
  probability: number;
  weightTags: readonly string[];
};

export function buildWeightedSlices(
  slices: readonly SliceDefinition[],
  ctx: ResolveContext
): WeightedSlice[] {
  if (ctx.exactLandWeights) {
    return slices.map((s) => ({
      ...s,
      effectiveWeight: Math.max(0, s.baseWeight),
    }));
  }

  return slices.map((s) => {
    let w = s.baseWeight;
    for (const tag of s.weightTags ?? []) {
      if (tag === "negative") w *= ctx.negativeWeightMult;
      if (tag === "positive") w *= ctx.positiveWeightMult;
      if (tag === "rare") w *= ctx.rareWeightMult;
      if (tag === "stakes") {
        const mult = ctx.tagMults.stakes;
        if (mult != null) w *= mult;
      }
      const relicMult = ctx.tagMults[tag];
      if (relicMult != null) w *= relicMult;
    }
    if (ctx.wheelNegativeBias > 0 && (s.weightTags?.includes("negative") ?? false)) {
      w *= 1 + ctx.wheelNegativeBias;
    }
    return { ...s, effectiveWeight: Math.max(0, w) };
  });
}

export function resolveSliceIndex(slices: readonly WeightedSlice[]): number {
  const weights = slices.map((s) => s.effectiveWeight);
  const positive = weights.map((w, i) => (w > 0 ? i : -1)).filter((i) => i >= 0);
  if (positive.length === 0) return 0;
  if (positive.length === 1) return positive[0]!;
  const subWeights = positive.map((i) => weights[i]!);
  const subIndex = pickWeightedIndex(subWeights);
  return positive[subIndex]!;
}

export function resolveSlice(slices: readonly SliceDefinition[], ctx: ResolveContext): {
  index: number;
  slice: WeightedSlice;
} {
  const weighted = buildWeightedSlices(slices, ctx);
  const index = resolveSliceIndex(weighted);
  return { index, slice: weighted[index]! };
}

/** Per-slice odds for the current wheel + run context (sum of probabilities = 1). */
export function getSliceProbabilities(
  slices: readonly SliceDefinition[],
  ctx: ResolveContext
): SliceProbability[] {
  const weighted = buildWeightedSlices(slices, ctx);
  const total = weighted.reduce((sum, s) => sum + s.effectiveWeight, 0);
  const denom = total > 0 ? total : weighted.length || 1;

  return weighted.map((s) => ({
    id: s.id,
    label: s.label,
    kind: s.kind,
    effectiveWeight: s.effectiveWeight,
    probability: s.effectiveWeight / denom,
    weightTags: s.weightTags ?? [],
  }));
}

/** Monte Carlo distribution — use in tests or `npm run simulate:wheel`. */
export function simulateSpinDistribution(
  slices: readonly SliceDefinition[],
  ctx: ResolveContext,
  spinCount: number
): Map<string, { count: number; rate: number; label: string }> {
  const weighted = buildWeightedSlices(slices, ctx);
  const counts = new Map<string, { count: number; label: string }>();

  for (let i = 0; i < spinCount; i++) {
    const idx = resolveSliceIndex(weighted);
    const slice = weighted[idx]!;
    const prev = counts.get(slice.id);
    counts.set(slice.id, {
      count: (prev?.count ?? 0) + 1,
      label: slice.label,
    });
  }

  const out = new Map<string, { count: number; rate: number; label: string }>();
  for (const [id, { count, label }] of counts) {
    out.set(id, { count, rate: count / spinCount, label });
  }
  return out;
}

export function formatProbabilityTable(rows: SliceProbability[]): string {
  const lines = ["slice_id | label | weight | chance% | tags", "---------|-------|--------|---------|----"];
  for (const r of rows) {
    const tags = r.weightTags.join(",") || "—";
    lines.push(
      `${r.id} | ${r.label} | ${r.effectiveWeight.toFixed(2)} | ${(r.probability * 100).toFixed(1)}% | ${tags}`
    );
  }
  return lines.join("\n");
}
