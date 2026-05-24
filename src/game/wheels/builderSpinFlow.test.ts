import { describe, expect, it } from "vitest";
import { resolveSlice } from "../../systems/ProbabilityResolver";
import { buildResolveContext } from "../../hooks/useWheelModifiers";
import { RunManager } from "../../systems/RunManager";
import { commitPendingWheelRebuild } from "../../systems/PerkSystem";
import { syncRunWheels } from "../../systems/WheelSystem";

describe("builder wheel spin prep", () => {
  it("commitPendingWheelRebuild clears flag and applies wedge layout before spin", () => {
    let run = RunManager.createInitialRun(1);
    run = {
      ...run,
      wheelIndex: 6,
      sliceCapacity: 7,
      permanentWedgeBonus: 1,
      pendingWheelRebuild: true,
    };
    const slicesBefore = run.wheels[6]!.slices.length;

    const committed = commitPendingWheelRebuild(run);
    expect(committed.pendingWheelRebuild).toBe(false);
    expect(committed.wheels[6]!.slices.length).toBeGreaterThan(slicesBefore);
    expect(committed.wheels[6]!.slices.length).toBe(7);
  });

  it("syncRunWheels commits pending rebuild in one step (builder wheel 7)", () => {
    let run = RunManager.createInitialRun(1);
    run = {
      ...run,
      wheelIndex: 6,
      sliceCapacity: 7,
      permanentWedgeBonus: 1,
      pendingWheelRebuild: true,
    };
    const synced = syncRunWheels(run);
    expect(synced.pendingWheelRebuild).toBe(false);
    expect(synced.wheels[6]!.slices.length).toBe(7);
  });

  it("resolve after sync uses same wheel slice count as committed layout", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, wheelIndex: 6, sliceCapacity: 7, permanentWedgeBonus: 1, pendingWheelRebuild: true };
    const synced = syncRunWheels(run);
    const wheel = synced.wheels[6]!;
    const ctx = buildResolveContext(synced, wheel, 6);
    const { index, slice } = resolveSlice(wheel.slices, ctx);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(wheel.slices.length);
    expect(slice.id).toBeTruthy();
    expect(wheel.slices[index]?.id).toBe(slice.id);
  });
});
