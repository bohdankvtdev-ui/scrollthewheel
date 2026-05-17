import { describe, expect, it } from "vitest";
import { applyAdvancementsToSlices } from "../advancements/applyAdvancements";
import { applyPerkSpinEffects } from "../effects/applyPerkEffects";
import { getConfiguredWheelSlices } from "../wheels/database/loader";
import {
  getSliceProbabilities,
  simulateSpinDistribution,
} from "../../systems/ProbabilityResolver";
import { DEFAULT_RESOLVE_CONTEXT } from "../../systems/types";

const EXACT = { ...DEFAULT_RESOLVE_CONTEXT, exactLandWeights: true };

function sumBaseWeights(slices: { baseWeight: number }[]): number {
  return slices.reduce((s, r) => s + r.baseWeight, 0);
}

function sumProbabilities(
  slices: Parameters<typeof getSliceProbabilities>[0],
  ctx: Parameters<typeof getSliceProbabilities>[1]
): number {
  return getSliceProbabilities(slices, ctx).reduce((s, r) => s + r.probability, 0);
}

describe("slice probability integrity", () => {
  it("base 6-slice wheels sum configured weights to 100", () => {
    for (const id of ["wheel_1", "wheel_2", "wheel_3", "wheel_6", "wheel_9"] as const) {
      const slices = getConfiguredWheelSlices(id, id, 1);
      expect(sumBaseWeights(slices)).toBe(100);
    }
  });

  it("7–9 slice advancement wheels still sum base weights to 100", () => {
    const base = getConfiguredWheelSlices("wheel_3", "wheel_3", 1);
    const seven = applyAdvancementsToSlices(base, "wheel_3", 1, ["money_on_all"]);
    const nine = applyAdvancementsToSlices(base, "wheel_3", 1, [
      "money_on_all",
      "perk_on_all",
      "percent_drip",
    ]);
    expect(seven).toHaveLength(7);
    expect(nine).toHaveLength(9);
    expect(sumBaseWeights(seven)).toBe(100);
    expect(sumBaseWeights(nine)).toBe(100);
  });

  it("each injected advancement wedge is ~9% land before perks", () => {
    const base = getConfiguredWheelSlices("wheel_3", "wheel_3", 1);
    const withMoney = applyAdvancementsToSlices(base, "wheel_3", 1, ["money_on_all"]);
    const inj = withMoney.find((s) => s.id.includes("_inj_money"))!;
    expect(inj.baseWeight).toBe(9);

    const probs = getSliceProbabilities(withMoney, EXACT);
    const land = probs.find((p) => p.id === inj.id)!.probability * 100;
    expect(land).toBeGreaterThanOrEqual(8.5);
    expect(land).toBeLessThanOrEqual(9.5);
  });

  it("spin probabilities always normalize to 100% (6, 7, 9 slices)", () => {
    const base = getConfiguredWheelSlices("wheel_3", "wheel_3", 1);
    const cases = [
      base,
      applyAdvancementsToSlices(base, "wheel_3", 1, ["money_on_all"]),
      applyAdvancementsToSlices(base, "wheel_3", 1, ["money_on_all", "perk_on_all", "percent_drip"]),
    ];
    for (const slices of cases) {
      expect(sumProbabilities(slices, EXACT)).toBeCloseTo(1, 5);
    }
  });

  it("lucky_money boosts money wedges but not neutral on money archetype", () => {
    const slices = [
      {
        id: "m1",
        kind: "money" as const,
        label: "+$50",
        icon: "attach-money",
        iconFamily: "MaterialIcons" as const,
        baseWeight: 25,
        weightTags: ["positive"] as const,
        payload: { moneyDelta: 50 },
      },
      {
        id: "pass",
        kind: "neutral" as const,
        label: "Pass",
        icon: "remove",
        iconFamily: "MaterialIcons" as const,
        baseWeight: 75,
        payload: {},
      },
    ];
    const base = getSliceProbabilities(slices, applyPerkSpinEffects(EXACT, [], "money"));
    const lucky = getSliceProbabilities(
      slices,
      applyPerkSpinEffects(EXACT, ["lucky_money"], "money")
    );
    expect(lucky.find((r) => r.id === "m1")!.probability).toBeGreaterThan(
      base.find((r) => r.id === "m1")!.probability
    );
    expect(lucky.find((r) => r.id === "pass")!.probability).toBeLessThan(
      base.find((r) => r.id === "pass")!.probability
    );
  });

  it("lucky_streak shifts positive vs negative share on 7-slice risk wheel", () => {
    const slices = applyAdvancementsToSlices(
      getConfiguredWheelSlices("wheel_3", "wheel_3", 1),
      "wheel_3",
      1,
      ["money_on_all"]
    );
    const base = getSliceProbabilities(
      slices,
      applyPerkSpinEffects(EXACT, [], "risk")
    );
    const lucky = getSliceProbabilities(
      slices,
      applyPerkSpinEffects(EXACT, ["lucky_streak"], "risk")
    );
    const pos = (rows: typeof base) =>
      rows.filter((r) => r.weightTags.includes("positive")).reduce((s, r) => s + r.probability, 0);
    const neg = (rows: typeof base) =>
      rows.filter((r) => r.weightTags.includes("negative")).reduce((s, r) => s + r.probability, 0);
    expect(pos(lucky)).toBeGreaterThan(pos(base));
    expect(neg(lucky)).toBeLessThan(neg(base));
  });

  it("monte carlo matches theory on 7-slice risk wheel", () => {
    const slices = applyAdvancementsToSlices(
      getConfiguredWheelSlices("wheel_3", "wheel_3", 1),
      "wheel_3",
      1,
      ["money_on_all"]
    );
    const theory = getSliceProbabilities(slices, EXACT);
    const sim = simulateSpinDistribution(slices, EXACT, 12_000);

    for (const row of theory) {
      const observed = sim.get(row.id)?.rate ?? 0;
      expect(Math.abs(observed - row.probability)).toBeLessThan(0.04);
    }
  });
});
