import { describe, expect, it } from "vitest";
import { SLICE_POOLS } from "../prizes";
import {
  applyRunStreakAfterSpin,
  winStreakChipBonus,
  winStreakMoneyMult,
} from "./runStreaks";

describe("runStreaks", () => {
  it("win streak scales chip bonus and money mult", () => {
    expect(winStreakChipBonus(5)).toBe(6);
    expect(winStreakMoneyMult(5)).toBeGreaterThan(1.1);
    expect(winStreakMoneyMult(1)).toBe(1);
  });

  it("resets win streak on loss", () => {
    const loss = SLICE_POOLS.yield.find((s) => s.kind === "money_loss") ?? SLICE_POOLS.yield[0]!;
    const run = applyRunStreakAfterSpin(
      { winStreak: 4 } as never,
      loss,
      100,
      50,
      false
    );
    expect(run.winStreak).toBe(0);
  });
});
