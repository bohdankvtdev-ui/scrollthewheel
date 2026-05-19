import { describe, expect, it } from "vitest";
import { isBankruptMoneyReveal, moneyRevealDurationMs, projectedBank } from "./moneyReveal";

describe("moneyReveal", () => {
  it("projects bank after delta", () => {
    expect(projectedBank({ before: 100, delta: -40 })).toBe(60);
    expect(projectedBank({ before: 50, delta: -80 })).toBe(0);
  });

  it("detects bankruptcy reveal", () => {
    expect(isBankruptMoneyReveal({ before: 100, delta: -100 })).toBe(true);
    expect(isBankruptMoneyReveal({ before: 100, delta: -50 })).toBe(false);
    expect(isBankruptMoneyReveal(null)).toBe(false);
  });

  it("uses shorter duration for bankruptcy losses", () => {
    expect(moneyRevealDurationMs({ before: 200, delta: -200 })).toBe(880);
    expect(moneyRevealDurationMs({ before: 200, delta: -50 })).toBe(1200);
    expect(moneyRevealDurationMs({ before: 200, delta: 100 })).toBe(2200);
  });
});
