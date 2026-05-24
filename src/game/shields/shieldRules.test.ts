import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { applyPerkAcquisition } from "../../systems/PerkSystem";
import { resolveAndApplyWheel } from "../services/wheelResolver";

describe("shieldRules", () => {
  it("iron_reserve grants shield without occupying a perk slot", () => {
    let run = RunManager.createInitialRun(1);
    run = applyPerkAcquisition(run, "iron_reserve");
    expect(run.shields).toBe(1);
    expect(run.perks).not.toContain("iron_reserve");
    expect(run.shieldPerks).toContain("iron_reserve");
  });

  it("shield blocks money loss with no bank change", () => {
    let run = RunManager.createInitialRun(1);
    run = { ...run, money: 200, shields: 1 };
    const wheel = run.wheels[0]!;
    const loss = wheel.slices.find((s) => (s.payload.moneyDelta ?? 0) < 0);
    expect(loss).toBeDefined();
    const resolved = resolveAndApplyWheel(run, 0, loss!);
    expect(resolved.shieldBlocked).toBe(true);
    expect(resolved.run.money).toBe(200);
    expect(resolved.run.shields).toBe(0);
    expect(resolved.moneyReveal).toBeUndefined();
  });
});
