import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { SLICE_POOLS } from "../prizes";
import { applyRunPressureAfterSpin, isPressureRunOver } from "./runPressure";

describe("runPressure", () => {
  it("starts at $0 with no instant loss", () => {
    const run = RunManager.createInitialRun(1);
    expect(run.money).toBe(0);
    expect(isPressureRunOver(run)).toBe(false);
  });

  it("bad spins at $0 build heat until run ends", () => {
    let run = RunManager.createInitialRun(1);
    const loss = SLICE_POOLS.yield.find((s) => s.kind === "money_loss") ?? SLICE_POOLS.yield[0]!;

    for (let i = 0; i < 5; i++) {
      run = applyRunPressureAfterSpin(run, loss, 0, 0, false);
    }
    expect(isPressureRunOver(run)).toBe(true);
    expect(RunManager.checkRunEnd(run).phase).toBe("lost_money");
  });
});
