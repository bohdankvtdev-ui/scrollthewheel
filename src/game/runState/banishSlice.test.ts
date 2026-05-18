import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { banishSliceOnWheel } from "./banishSlice";
import { catalogPrizeIdFromSliceId } from "../wheels/database/slicePrizeId";
import { getPrizeSlotsForWheel } from "../wheels/database/loader";

describe("catalogPrizeIdFromSliceId", () => {
  it("parses wheel instance + catalog prize + index", () => {
    expect(catalogPrizeIdFromSliceId("wheel_1_money_50_0")).toBe("money_50");
    expect(catalogPrizeIdFromSliceId("wheel_2_bank_gain_5_3")).toBe("bank_gain_5");
    expect(catalogPrizeIdFromSliceId("wheel_1_f2_money_100_1")).toBe("money_100");
  });
});

describe("banishSliceOnWheel", () => {
  it("removes a wedge from the current wheel layout", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, inventory: { wedgeEraser: 1 } };
    const wheel = run.wheels[0]!;
    const targetIndex = 0;
    const targetId = wheel.slices[targetIndex]!.id;
    const prizeId = catalogPrizeIdFromSliceId(targetId);
    expect(prizeId).toBeTruthy();

    const beforeIds = wheel.slices.map((s) => s.id);
    const result = banishSliceOnWheel(run, 0, targetIndex);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.run.inventory?.wedgeEraser).toBe(0);
    expect(result.run.banishedPrizes?.wheel_1).toContain(prizeId!);

    const afterWheel = result.run.wheels[0]!;
    expect(afterWheel.slices.length).toBe(wheel.slices.length);
    expect(afterWheel.slices.some((s) => s.id === targetId)).toBe(false);
    expect(afterWheel.slices.map((s) => s.id)).not.toEqual(beforeIds);
  });

  it("passes banished prizes into wheel rebuild", () => {
    const run = RunManager.createInitialRun(1);
    const banned = ["money_50"];
    const slots = getPrizeSlotsForWheel("wheel_1", {
      runId: run.runId,
      cycle: run.floor,
      banishedPrizes: banned,
    });
    expect(slots.every((s) => !banned.includes(s.prize))).toBe(true);
  });
});
