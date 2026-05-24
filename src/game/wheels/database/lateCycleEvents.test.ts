import { describe, expect, it } from "vitest";
import { getConfiguredWheelSlices } from "./loader";
import { LATE_CYCLE_MIN } from "./lateCycleEvents";

describe("lateCycleEvents", () => {
  it("no bank wipe on any wheel before cycle 4", () => {
    for (const id of ["wheel_1", "wheel_5", "wheel_8", "wheel_9"] as const) {
      const slices = getConfiguredWheelSlices(id, id, { runId: "early", cycle: 3 });
      expect(slices.some((s) => s.kind === "bank_wipe")).toBe(false);
    }
  });

  it("chaos can roll wipe at cycle 4+ (low weight)", () => {
    let sawWipe = false;
    for (let seed = 0; seed < 64; seed++) {
      const slices = getConfiguredWheelSlices("wheel_8", "wheel_8", {
        runId: `wipe-hunt-${seed}`,
        cycle: LATE_CYCLE_MIN,
      });
      if (slices.some((s) => s.kind === "bank_wipe")) {
        sawWipe = true;
        break;
      }
    }
    expect(sawWipe).toBe(true);
  });

  it("perk wheel can offer harm debuffs from cycle 4", () => {
    let sawHarm = false;
    for (let seed = 0; seed < 30; seed++) {
      const slices = getConfiguredWheelSlices("wheel_4", "wheel_4", {
        runId: `harm-${seed}`,
        cycle: LATE_CYCLE_MIN,
        ownedPerks: [],
      });
      if (slices.some((s) => s.kind === "debuff")) {
        sawHarm = true;
        break;
      }
    }
    expect(sawHarm).toBe(true);
  });
});
