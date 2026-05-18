import { describe, expect, it } from "vitest";
import { RunManager } from "./RunManager";
import { ShopSystem } from "./ShopSystem";
import { buildWheel } from "./WheelSystem";
import { WHEEL_ROTATION } from "../game/loop";
import { SLICES_PER_WHEEL } from "../game/wheels/database";

describe("WheelSystem", () => {
  it("database wheels always render six slices regardless of run capacity", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, sliceCapacity: 8 as typeof run.sliceCapacity };
    const wheel = buildWheel(WHEEL_ROTATION[0]!, run);
    expect(wheel.definition.wheelConfigId).toBeTruthy();
    expect(wheel.slices.length).toBeGreaterThanOrEqual(SLICES_PER_WHEEL);
    expect(wheel.spinItems.length).toBe(wheel.slices.length);
  });

  it("shop sells perks for chips without spending bank money", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, chipsEarnedThisRun: 20 };
    const moneyBefore = run.money;
    const bought = ShopSystem.buy(run, "lucky_streak");
    expect(bought.ok).toBe(true);
    if (bought.ok) {
      expect(bought.run.money).toBe(moneyBefore);
      expect(bought.run.perks).toContain("lucky_streak");
    }
  });
});
