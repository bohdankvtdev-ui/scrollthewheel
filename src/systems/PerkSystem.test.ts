import { describe, expect, it } from "vitest";
import { RunManager } from "./RunManager";
import { applyBankPercent, applyMoneyDelta } from "./PerkSystem";

describe("PerkSystem money math", () => {
  it("applies gold_rush once per money slice", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, money: 0, perks: ["gold_rush"] };
    const next = applyMoneyDelta(run, 100);
    expect(next.money).toBe(125);
  });

  it("vip_roller boosts percent wheel gains via applyBankPercent", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, money: 1000, perks: ["vip_roller"] };
    const next = applyBankPercent(run, 0.1);
    expect(next.money).toBe(1000 + Math.floor(100 * 1.15));
  });

  it("curse_of_greed taxes money gains", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, money: 0, debuffs: ["curse_of_greed"] };
    const next = applyMoneyDelta(run, 100);
    expect(next.money).toBe(85);
  });

  it("debt_mark taxes money gains", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, money: 0, debuffs: ["debt_mark"] };
    const next = applyMoneyDelta(run, 100);
    expect(next.money).toBe(90);
  });
});
