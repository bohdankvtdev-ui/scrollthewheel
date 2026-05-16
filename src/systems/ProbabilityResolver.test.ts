import { describe, expect, it } from "vitest";
import { SLICE_POOLS } from "../game/prizes";
import type { SliceDefinition } from "../schemas";
import { DEFAULT_RESOLVE_CONTEXT } from "./types";
import {
  buildWeightedSlices,
  formatProbabilityTable,
  getSliceProbabilities,
  resolveSliceIndex,
  simulateSpinDistribution,
} from "./ProbabilityResolver";

const slices: SliceDefinition[] = [
  {
    id: "a",
    kind: "money",
    label: "A",
    icon: "a",
    iconFamily: "MaterialIcons",
    baseWeight: 10,
    weightTags: ["positive"],
    payload: {},
  },
  {
    id: "b",
    kind: "money_loss",
    label: "B",
    icon: "b",
    iconFamily: "MaterialIcons",
    baseWeight: 1,
    weightTags: ["negative"],
    payload: {},
  },
];

describe("ProbabilityResolver", () => {
  it("increases negative weight with multiplier", () => {
    const low = buildWeightedSlices(slices, { ...DEFAULT_RESOLVE_CONTEXT, negativeWeightMult: 1 });
    const high = buildWeightedSlices(slices, { ...DEFAULT_RESOLVE_CONTEXT, negativeWeightMult: 3 });
    const negLow = low.find((s) => s.id === "b")!.effectiveWeight;
    const negHigh = high.find((s) => s.id === "b")!.effectiveWeight;
    expect(negHigh).toBeGreaterThan(negLow);
  });

  it("resolveSliceIndex returns valid index", () => {
    const weighted = buildWeightedSlices(slices, DEFAULT_RESOLVE_CONTEXT);
    for (let i = 0; i < 20; i++) {
      const idx = resolveSliceIndex(weighted);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(weighted.length);
    }
  });

  it("lucky_streak (+15% positive weight) raises odds of positive-tagged slices", () => {
    const pool = SLICE_POOLS.yield.slice(0, 6);
    const base = getSliceProbabilities(pool, DEFAULT_RESOLVE_CONTEXT);
    const lucky = getSliceProbabilities(pool, {
      ...DEFAULT_RESOLVE_CONTEXT,
      positiveWeightMult: 1.15,
    });
    const positiveBase = base
      .filter((s) => s.weightTags.includes("positive"))
      .reduce((sum, s) => sum + s.probability, 0);
    const positiveLucky = lucky
      .filter((s) => s.weightTags.includes("positive"))
      .reduce((sum, s) => sum + s.probability, 0);

    expect(positiveLucky).toBeGreaterThan(positiveBase);
  });

  it("simulation converges toward theoretical weights", () => {
    const probs = getSliceProbabilities(slices, DEFAULT_RESOLVE_CONTEXT);
    const sim = simulateSpinDistribution(slices, DEFAULT_RESOLVE_CONTEXT, 8000);
    const aTheory = probs.find((p) => p.id === "a")!.probability;
    const aSim = sim.get("a")!.rate;
    expect(Math.abs(aSim - aTheory)).toBeLessThan(0.05);
  });
});

/** Run with: npm run simulate:wheel — prints odds table for yield pool */
describe("wheel odds report", () => {
  it("prints yield pool table (manual)", () => {
    const pool = SLICE_POOLS.yield.slice(0, 6);
    const ctx = { ...DEFAULT_RESOLVE_CONTEXT, positiveWeightMult: 1.15 };
    const table = formatProbabilityTable(getSliceProbabilities(pool, ctx));
    // eslint-disable-next-line no-console
    console.log("\n" + table + "\n");
    expect(table).toContain("y_money");
  });
});
