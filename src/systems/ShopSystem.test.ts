import { describe, expect, it } from "vitest";
import { RUN_DEFAULTS } from "../game/loop";
import { getSpendableChips } from "../game/shop/chipEconomy";
import { RunManager } from "./RunManager";
import { ShopSystem } from "./ShopSystem";

describe("ShopSystem chip economy", () => {
  it("buys perks with chips not money", () => {
    let run = { ...RunManager.createInitialRun(), chipsEarnedThisRun: 20 };
    const moneyBefore = run.money;
    const chipsBefore = getSpendableChips(run);
    expect(chipsBefore).toBe(20);

    const result = ShopSystem.buy(run, "lucky_streak");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.run.money).toBe(moneyBefore);
    expect(getSpendableChips(result.run)).toBeLessThan(chipsBefore);
    expect(result.run.perks).toContain("lucky_streak");
  });

  it("rejects purchase when chips are insufficient", () => {
    const run = {
      ...RunManager.createInitialRun(),
      chipsEarnedThisRun: 0,
      perks: [],
    };
    const result = ShopSystem.buy(run, "lucky_streak");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/chip/i);
  });
});
