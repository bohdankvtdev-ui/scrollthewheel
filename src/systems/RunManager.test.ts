import { describe, expect, it } from "vitest";
import { RunManager } from "./RunManager";
import { WHEEL_COUNT } from "../data/wheels/runPipeline";

describe("RunManager", () => {
  it("creates run at $0 with full wheel pipeline", () => {
    const run = RunManager.createInitialRun();
    expect(run.wheels).toHaveLength(WHEEL_COUNT);
    expect(run.money).toBe(0);
    expect(run.chipsEarnedThisRun).toBe(0);
    expect(run.phase).toBe("active");
    expect(RunManager.canSpin(run, 0)).toBe(true);
  });

  it("advances wheel index", () => {
    let run = RunManager.createInitialRun();
    run = RunManager.advanceWheel(run);
    expect(run.wheelIndex).toBe(1);
  });

  it("ends run when money goes negative", () => {
    let run = RunManager.createInitialRun();
    run = { ...run, money: -1 };
    run = RunManager.checkRunEnd(run);
    expect(run.phase).toBe("lost_money");
  });

  it("allows spinning at $0", () => {
    const run = RunManager.createInitialRun();
    expect(RunManager.canSpin(run, 0)).toBe(true);
  });
});
