import { describe, expect, it } from "vitest";
import { simulateCycle1EarlyChipsFromWins, simulateWheelEv } from "./cycleEvSim";

describe("cycleEvSim", () => {
  it("W1 cycle 1 mean delta stays in modest positive band at $100 bank", () => {
    const ev = simulateWheelEv("wheel_1", 1, 100, 1500, 42);
    expect(ev.meanDelta).toBeGreaterThan(10);
    expect(ev.meanDelta).toBeLessThan(120);
  });

  it("W5 drain has substantial negative-% slice share", () => {
    const ev = simulateWheelEv("wheel_5", 1, 500, 800, 55);
    expect(ev.pctNegativeSlices).toBeGreaterThanOrEqual(35);
  });

  it("cycle 1 early chip budget stays under loose ceiling", () => {
    const { meanChips, p90 } = simulateCycle1EarlyChipsFromWins(100, 400);
    expect(meanChips).toBeLessThan(28);
    expect(p90).toBeLessThan(35);
  });
});
