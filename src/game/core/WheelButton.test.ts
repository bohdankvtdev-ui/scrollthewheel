import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { evaluateWheelButton } from "./WheelButton";

describe("evaluateWheelButton", () => {
  it("allows spin on active run when idle", () => {
    const run = RunManager.createInitialRun();
    expect(evaluateWheelButton(run, false)).toEqual({ canSpin: true });
  });

  it("blocks spin while animating or after run ends", () => {
    const run = RunManager.createInitialRun();
    expect(evaluateWheelButton(run, true).canSpin).toBe(false);
    const ended = { ...run, phase: "lost_money" as const };
    expect(evaluateWheelButton(ended, false).canSpin).toBe(false);
  });
});
