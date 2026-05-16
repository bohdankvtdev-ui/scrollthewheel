import { describe, expect, it } from "vitest";
import { getSliceProbabilities } from "../../../systems/ProbabilityResolver";
import { DEFAULT_RESOLVE_CONTEXT } from "../../../systems/types";
import { buildSlicesFromPrizes, getConfiguredWheelSlices } from "./loader";
import { validateAllWheels, formatWheelOddsReport } from "./validate";
import { FLOOR_WHEEL_ORDER } from "./wheelDatabase";

describe("wheelDatabase", () => {
  it("every wheel has unique prize rows that become visible slices", () => {
    for (const id of FLOOR_WHEEL_ORDER) {
      const slices = getConfiguredWheelSlices(id, id);
      expect(slices.length).toBeGreaterThan(0);
      const labels = new Set(slices.map((s) => s.label));
      expect(labels.size).toBe(slices.length);
    }
  });

  it("shows all rows on wheel; chance 0 never wins", () => {
    const slices = buildSlicesFromPrizes(
      [
        { prize: "money_200", chance: 100 },
        { prize: "money_120", chance: 0 },
        { prize: "perk_gold_rush", chance: 0 },
      ],
      "test"
    );
    expect(slices).toHaveLength(3);
    const probs = getSliceProbabilities(slices, {
      ...DEFAULT_RESOLVE_CONTEXT,
      exactLandWeights: true,
    });
    expect(probs.find((p) => p.label === "+$200")?.probability).toBe(1);
    expect(probs.find((p) => p.label === "+$120")?.probability).toBe(0);
  });

  it("wheel_1 live config matches database land weights", () => {
    const slices = getConfiguredWheelSlices("wheel_1", "wheel_1");
    const probs = getSliceProbabilities(slices, {
      ...DEFAULT_RESOLVE_CONTEXT,
      exactLandWeights: true,
    });
    const winner = probs.reduce((best, row) => (row.probability > best.probability ? row : best));
    expect(winner.probability).toBe(1);
    expect(winner.label).toBe("Lucky");
  });

  it("all wheels validate to ~100% land chance", () => {
    expect(validateAllWheels()).toEqual([]);
  });

  it("prints wheel_1 odds (manual inspect)", () => {
    const report = formatWheelOddsReport("wheel_1");
    // eslint-disable-next-line no-console
    console.log("\n" + report + "\n");
    expect(report).toContain("Lucky");
    expect(report).toContain("100.0%");
  });
});
