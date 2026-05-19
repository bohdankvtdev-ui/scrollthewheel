import { describe, expect, it } from "vitest";
import { resolveAndApplyWheel } from "../game/services/wheelResolver";
import { RunManager } from "./RunManager";
import { RUN_DEFAULTS } from "../game/loop";

describe("RunManager", () => {
  it("creates run with 9 wheels and starting money", () => {
    const run = RunManager.createInitialRun(1);
    expect(run.wheels).toHaveLength(9);
    expect(run.money).toBe(RUN_DEFAULTS.startingMoney);
    expect(run.phase).toBe("active");
    expect(run.peakMoney).toBe(0);
  });

  it("allows $0 bank before first spin", () => {
    const run = RunManager.createInitialRun(1);
    expect(run.money).toBe(0);
    expect(run.chipsEarnedThisRun).toBe(0);
    expect(RunManager.checkRunEnd(run).phase).toBe("active");
    expect(RunManager.canSpin(run, 0)).toBe(true);
  });

  it("ends run at $0 after playing", () => {
    const run = {
      ...RunManager.createInitialRun(1),
      money: 0,
      history: [{ wheelIndex: 0, sliceId: "x", floor: 1, ts: 1 }],
    };
    expect(RunManager.checkRunEnd(run).phase).toBe("lost_money");
    expect(RunManager.canSpin(run, 0)).toBe(false);
  });

  it("pending cash loss animates before bank drops", () => {
    const run = { ...RunManager.createInitialRun(1), money: 80 };
    const slice = run.wheels[1]!.slices.find(
      (s) => s.payload.bankPercent != null && s.payload.bankPercent < 0
    );
    expect(slice).toBeDefined();
    const result = resolveAndApplyWheel(run, 1, slice!);
    expect(result.run.money).toBe(80);
    expect(result.run.phase).toBe("active");
    expect(result.moneyReveal?.delta).toBeLessThan(0);
  });

  it("pending cash win at $0 does not trigger bankruptcy before payout", () => {
    const run = RunManager.createInitialRun(1);
    const wheel = run.wheels[0]!;
    const slice = wheel.slices.find((s) => (s.payload.moneyDelta ?? 0) > 0);
    expect(slice).toBeDefined();
    const result = resolveAndApplyWheel(run, 0, slice!);
    expect(result.run.money).toBe(0);
    expect(result.run.phase).toBe("active");
    expect(result.moneyReveal?.delta).toBeGreaterThan(0);
  });

  it("advancing before payout commits would wrongly bankrupt at $0", () => {
    const run = RunManager.createInitialRun(1);
    const slice = run.wheels[0]!.slices.find((s) => (s.payload.moneyDelta ?? 0) > 0);
    expect(slice).toBeDefined();
    const pending = resolveAndApplyWheel(run, 0, slice!);
    expect(RunManager.advanceWheel(pending.run).phase).toBe("lost_money");
    expect(pending.run.history.length).toBeGreaterThan(0);
    expect(pending.run.money).toBe(0);
  });

  it("clears cycle 1 after wheel 9 and can start cycle 2", () => {
    let run = {
      ...RunManager.createInitialRun(1),
      wheelIndex: 8,
      money: 200,
      history: [{ wheelIndex: 8, sliceId: "test", floor: 1, ts: 1 }],
    };
    const won = RunManager.advanceWheel(run);
    expect(won.phase).toBe("won");
    expect(won.lastCycleReward?.cycle).toBe(1);
    expect(won.runEffects?.pitStopPending).toBe(true);

    const cycle2 = RunManager.enterInfiniteFloor(won);
    expect(cycle2.phase).toBe("active");
    expect(cycle2.floor).toBe(2);
    expect(cycle2.wheelIndex).toBe(0);
    expect(cycle2.wheels).toHaveLength(9);
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
