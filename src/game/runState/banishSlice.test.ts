import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { laserRemoveSliceFromWheel, LASER_MIN_SLICE_COUNT } from "./laserSlice";
import { getPrizeSlotsForWheel } from "../wheels/database/loader";

describe("laserRemoveSliceFromWheel", () => {
  it("removes one wedge from the current wheel (fewer slices)", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, inventory: { wedgeEraser: 1 } };
    const wheel = run.wheels[0]!;
    const beforeLen = wheel.slices.length;
    const targetIndex = 0;
    const targetId = wheel.slices[targetIndex]!.id;

    const result = laserRemoveSliceFromWheel(run, 0, targetIndex);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.run.inventory?.wedgeEraser).toBe(0);
    expect(result.run.wheelLaserCuts?.wheel_1).toBe(1);

    const afterWheel = result.run.wheels[0]!;
    expect(afterWheel.slices.length).toBe(beforeLen - 1);
    expect(afterWheel.slices.some((s) => s.id === targetId)).toBe(false);
    expect(afterWheel.spinItems.length).toBe(afterWheel.slices.length);
  });

  it("rebuild respects laser cuts (fewer prize rows)", () => {
    const run = RunManager.createInitialRun(1);
    const slots = getPrizeSlotsForWheel("wheel_1", {
      runId: run.runId,
      cycle: run.floor,
      wheelLaserCuts: { wheel_1: 1 },
    });
    expect(slots.length).toBe(6 - 1);
    expect(slots.length).toBeGreaterThanOrEqual(LASER_MIN_SLICE_COUNT);
  });
});
