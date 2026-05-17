import { describe, expect, it } from "vitest";
import { applyPerkSpinEffects } from "./applyPerkEffects";
import { getCycleAdvancement } from "./cycleAdvancement";
import { DEFAULT_RESOLVE_CONTEXT } from "../../systems/types";

describe("perk effect system", () => {
  it("lucky_money only boosts money slices on money wheel", () => {
    const money = applyPerkSpinEffects(DEFAULT_RESOLVE_CONTEXT, ["lucky_money"], "money");
    const perk = applyPerkSpinEffects(DEFAULT_RESOLVE_CONTEXT, ["lucky_money"], "joker_offer");
    expect(money.kindWeightMults?.money).toBeGreaterThan(1.11);
    expect(perk.kindWeightMults?.money ?? 1).toBe(1);
  });

  it("lucky_perk only boosts perk slices on perk wheel", () => {
    const perk = applyPerkSpinEffects(DEFAULT_RESOLVE_CONTEXT, ["lucky_perk"], "joker_offer");
    const money = applyPerkSpinEffects(DEFAULT_RESOLVE_CONTEXT, ["lucky_perk"], "money");
    expect(perk.kindWeightMults?.perk).toBeGreaterThan(1.11);
    expect(money.kindWeightMults?.perk ?? 1).toBe(1);
  });

  it("advancement tier grows every 3 cycles", () => {
    expect(getCycleAdvancement(1).tier).toBe(0);
    expect(getCycleAdvancement(3).tier).toBe(0);
    expect(getCycleAdvancement(4).tier).toBe(1);
    expect(getCycleAdvancement(10).tier).toBe(3);
  });
});
