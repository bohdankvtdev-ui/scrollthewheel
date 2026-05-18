import { describe, expect, it } from "vitest";
import { getConfiguredWheelSlices } from "./database/loader";
import { RunManager } from "../../systems/RunManager";
import { commitPendingWheelRebuild } from "../../systems/PerkSystem";
import { rebuildWheelsFromDatabase } from "../../systems/WheelSystem";

describe("builder +1 wedge flow", () => {
  it("applySliceResult bumps capacity and rebuild adds wedges to all wheels", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, wheelIndex: 6 };
    const builder = run.wheels[6]!;
    const slice = builder.slices.find((s) => s.payload.sliceDelta === 1);
    expect(slice).toBeDefined();

    const after = RunManager.applySliceResult(run, 6, slice!, run.money);
    expect(after.sliceCapacity).toBe(7);
    expect(after.permanentWedgeBonus).toBe(1);
    expect(after.pendingWheelRebuild).toBe(true);

    const rebuilt = commitPendingWheelRebuild(after);
    expect(rebuilt.pendingWheelRebuild).toBe(false);
    expect(rebuilt.wheels[7]!.slices.length).toBe(7);
    expect(rebuilt.wheels[8]!.slices.length).toBe(7);
    expect(rebuilt.wheels[0]!.slices.length).toBe(7);
  });

  it("rebuildWheelsFromDatabase respects sliceCapacity when pending", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, sliceCapacity: 7, permanentWedgeBonus: 1, pendingWheelRebuild: true };
    const next = rebuildWheelsFromDatabase(run);
    expect(next.wheels[0]!.slices.length).toBe(7);
    const chaos = getConfiguredWheelSlices("wheel_8", "wheel_8", {
      runId: run.runId,
      cycle: 1,
      permanentWedgeBonus: 1,
    });
    expect(chaos.length).toBe(7);
  });
});
