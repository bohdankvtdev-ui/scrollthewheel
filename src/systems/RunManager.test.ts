import { describe, expect, it } from "vitest";
import { RunManager } from "./RunManager";
import { RUN_DEFAULTS } from "../game/loop";

describe("RunManager", () => {
  it("creates run with 9 wheels and starting money", () => {
    const run = RunManager.createInitialRun(1);
    expect(run.wheels).toHaveLength(9);
    expect(run.money).toBe(RUN_DEFAULTS.startingMoney);
    expect(run.phase).toBe("active");
  });

  it("allows $0 bank before first spin", () => {
    const run = RunManager.createInitialRun(1);
    expect(run.money).toBe(0);
    expect(run.chipsEarnedThisRun).toBe(0);
    expect(RunManager.checkRunEnd(run).phase).toBe("active");
    expect(RunManager.canSpin(run, 0)).toBe(true);
  });

  it("ends run when pressure maxes out", () => {
    const run = {
      ...RunManager.createInitialRun(1),
      money: 50,
      pressure: 5,
      history: [{ wheelIndex: 0, sliceId: "x", floor: 1, ts: 1 }],
    };
    expect(RunManager.checkRunEnd(run).phase).toBe("lost_money");
  });

  it("iron grit saves once at $0 after playing", () => {
    const run = {
      ...RunManager.createInitialRun(1),
      money: 0,
      relics: ["iron_grit"],
      history: [{ wheelIndex: 0, sliceId: "x", floor: 1, ts: 1 }],
    };
    const saved = RunManager.checkRunEnd(run);
    expect(saved.phase).toBe("active");
    expect(saved.money).toBe(1);
  });
});
