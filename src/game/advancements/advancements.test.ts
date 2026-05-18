import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { ShopSystem } from "../../systems/ShopSystem";
import { getConfiguredWheelSlices } from "../wheels/database/loader";
import { applyAdvancementsToSlices } from "./applyAdvancements";
import { getSliceCountForWheel } from "./sliceCount";

describe("advancements", () => {
  it("money_on_all adds 7th cash wedge on risk wheel", () => {
    const base = getConfiguredWheelSlices("wheel_3", "wheel_3", 1);
    expect(base).toHaveLength(6);
    const withAdv = applyAdvancementsToSlices(base, "wheel_3", 1, ["money_on_all"]);
    expect(withAdv.length).toBe(7);
    expect(withAdv.some((s) => s.kind === "money" && (s.payload.moneyDelta ?? 0) > 0)).toBe(true);
    expect(withAdv.reduce((s, r) => s + r.baseWeight, 0)).toBe(100);
  });

  it("perk_on_all adds perk wedge on money wheel", () => {
    const base = getConfiguredWheelSlices("wheel_1", "wheel_1", 1);
    const withAdv = applyAdvancementsToSlices(base, "wheel_1", 1, ["perk_on_all"]);
    expect(withAdv.length).toBe(7);
    expect(withAdv.some((s) => s.kind === "perk")).toBe(true);
  });

  it("stacking inject advancements yields up to 9 slices", () => {
    const adv = ["money_on_all", "perk_on_all", "percent_drip"];
    expect(getSliceCountForWheel(1, adv, "wheel_3")).toBe(6);
    const base = getConfiguredWheelSlices("wheel_3", "wheel_3", 1);
    const out = applyAdvancementsToSlices(base, "wheel_3", 1, adv);
    expect(out.length).toBe(9);
  });

  it("shop buys advancement, rebuilds wheels, bumps slice capacity", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, chipsEarnedThisRun: 200 };
    const result = ShopSystem.buyAdvancement(run, "money_on_all");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.run.advancements).toContain("money_on_all");
      expect(result.run.sliceCapacity).toBeGreaterThanOrEqual(7);
      const risk = result.run.wheels[2];
      expect(risk?.slices.length).toBeGreaterThanOrEqual(7);
    }
  });
});
