import { describe, expect, it } from "vitest";
import { SLICE_POOLS } from "../game/prizes";
import { RunManager } from "./RunManager";
import { ShopSystem } from "./ShopSystem";
import { buildWheel } from "./WheelSystem";
import { WHEEL_ROTATION } from "../game/loop";

describe("WheelSystem", () => {
  it("builds 8 slices when slice capacity is 8 (pool only has 6 — fills from expansion)", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, sliceCapacity: 8 };
    const wheel = buildWheel(WHEEL_ROTATION[0]!, run);
    expect(wheel.slices.length).toBe(8);
    expect(wheel.spinItems.length).toBe(8);
    expect(SLICE_POOLS.base.length).toBe(6);
  });

  it("applies +1 slice on next wheel from stabilizer slice", () => {
    let run = RunManager.createInitialRun(1);
    const wideSlice = SLICE_POOLS.stabilizer.find((s) => s.id === "s_expand")!;
    run = RunManager.applySliceResult(run, 0, wideSlice);
    expect(run.sliceCapacity).toBe(7);
    expect(run.pendingWheelRebuild).toBe(true);
    expect(run.wheels[0]!.slices.length).toBe(6);
    expect(run.perks).toContain("extra_slice");
  });

  it("shop extra_slice bumps capacity but defers layout", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, money: 500 };
    const bought = ShopSystem.buy(run, "extra_slice");
    expect(bought.ok).toBe(true);
    if (bought.ok) {
      expect(bought.run.sliceCapacity).toBe(7);
      expect(bought.run.pendingWheelRebuild).toBe(true);
      expect(bought.run.wheels[0]!.slices.length).toBe(6);
    }
  });
});
