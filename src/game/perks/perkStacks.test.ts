import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { applyMoneyDelta } from "../../systems/PerkSystem";
import {
  canAddPerkCopy,
  countUniqueJokerSlots,
  getLoadoutStacks,
  perkHiddenFromShop,
} from "./perkStacks";

describe("perkStacks", () => {
  it("allows stacking gold_rush in one slot with multiplied payout", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, money: 0, perks: ["gold_rush", "gold_rush"] };
    const next = applyMoneyDelta(run, 100);
    expect(next.money).toBe(Math.floor(100 * 1.12 * 1.12));
  });

  it("uses one joker slot for duplicate stackable perks", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, perks: ["gold_rush", "gold_rush", "lucky_money"] };
    expect(countUniqueJokerSlots(run)).toBe(2);
  });

  it("hides non-stackable owned perks from shop", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, perks: ["double_down"] };
    expect(perkHiddenFromShop(run, "double_down")).toBe(true);
    expect(canAddPerkCopy(run, "gold_rush")).toBe(true);
  });

  it("groups loadout stacks oldest-left with counts", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, perks: ["lucky_money", "gold_rush", "gold_rush"], debuffs: ["debt_mark", "debt_mark"] };
    const stacks = getLoadoutStacks(run);
    expect(stacks[0]?.id).toBe("lucky_money");
    expect(stacks.find((s) => s.id === "gold_rush")?.count).toBe(2);
    expect(stacks.find((s) => s.id === "debt_mark")?.count).toBe(2);
  });
});
