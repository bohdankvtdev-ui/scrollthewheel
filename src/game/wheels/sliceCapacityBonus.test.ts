import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { getConfiguredWheelSlices } from "./database/loader";
import {
  applyPostBuilderSliceFloor,
  getBuilderWheelSliceCount,
  POST_BUILDER_MIN_SLICE_CAPACITY,
  sliceCapacityForNextCycle,
} from "./sliceCapacityBonus";

describe("sliceCapacityBonus", () => {
  it("after builder wheel, run capacity is at least 7 and later wheels gain a wedge", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, wheelIndex: 7, sliceCapacity: 6 };
    run = applyPostBuilderSliceFloor(run);
    expect(run.permanentWedgeBonus).toBeGreaterThanOrEqual(1);
    expect(run.sliceCapacity).toBeGreaterThanOrEqual(POST_BUILDER_MIN_SLICE_CAPACITY);
    const chaos = getConfiguredWheelSlices("wheel_8", "wheel_8", {
      runId: run.runId,
      cycle: 1,
      permanentWedgeBonus: run.permanentWedgeBonus,
    });
    expect(chaos.length).toBe(7);
  });

  it("cycle 2 builder wheel is 6 base + permanent wedge bonus", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, sliceCapacity: 7, permanentWedgeBonus: 1 };
    run = {
      ...run,
      floor: 2,
      sliceCapacity: sliceCapacityForNextCycle(run),
      pendingWheelRebuild: true,
    };
    expect(getBuilderWheelSliceCount(run)).toBe(7);
    const builder = getConfiguredWheelSlices("wheel_7", "wheel_7", {
      runId: run.runId,
      cycle: 2,
      permanentWedgeBonus: run.permanentWedgeBonus,
    });
    expect(builder.length).toBe(7);
  });

  it("cycle advance preserves builder wedge bonus without adding cycle slices", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, sliceCapacity: 7, permanentWedgeBonus: 1 };
    const nextCap = sliceCapacityForNextCycle(run);
    expect(nextCap).toBe(7);
  });
});
