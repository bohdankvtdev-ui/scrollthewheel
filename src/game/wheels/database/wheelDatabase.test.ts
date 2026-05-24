import { describe, expect, it } from "vitest";
import {
  getSliceSlotPalette,
  getWheelSegmentColors,
  SLICE_SLOT_PALETTES,
} from "../../content/sliceVisualTheme";
import { getSliceProbabilities } from "../../../systems/ProbabilityResolver";
import { DEFAULT_RESOLVE_CONTEXT } from "../../../systems/types";
import { SLICES_PER_WHEEL } from "./constants";
import { buildSlicesFromPrizes, getConfiguredWheelSlices, getPrizeSlotsForWheel } from "./loader";
import { validateAllWheels, formatWheelOddsReport } from "./validate";
import { FLOOR_WHEEL_ORDER } from "./wheelDatabase";

describe("wheelDatabase", () => {
  it("every wheel has exactly six themed slices", () => {
    for (const id of FLOOR_WHEEL_ORDER) {
      const slices = getConfiguredWheelSlices(id, id);
      expect(slices).toHaveLength(SLICES_PER_WHEEL);
      expect(slices.length).toBe(SLICES_PER_WHEEL);
    }
  });

  it("shows all rows on wheel; chance 0 never wins", () => {
    const slices = buildSlicesFromPrizes(
      [
        { prize: "money_200", chance: 100 },
        { prize: "money_120", chance: 0 },
        { prize: "money_150", chance: 0 },
        { prize: "money_100", chance: 0 },
        { prize: "money_80", chance: 0 },
        { prize: "money_50", chance: 0 },
      ],
      "test"
    );
    expect(slices).toHaveLength(6);
    const probs = getSliceProbabilities(slices, {
      ...DEFAULT_RESOLVE_CONTEXT,
      exactLandWeights: true,
    });
    expect(probs.find((p) => p.label === "+$200")?.probability).toBe(1);
    expect(probs.find((p) => p.label === "+$120")?.probability).toBe(0);
  });

  it("percent wheel cycle 1 is ±5% / 10% / 15% of bank", () => {
    const c1 = getConfiguredWheelSlices("wheel_2", "wheel_2", 1);
    expect(c1).toHaveLength(6);
    const labels = c1.map((s) => s.label);
    expect(labels).toContain("+5%");
    expect(labels).toContain("+10%");
    expect(labels).toContain("+15%");
    expect(labels).toContain("−5%");
    expect(labels).toContain("−10%");
    expect(labels).toContain("−15%");
    expect(c1.every((s) => s.kind === "bank_cut")).toBe(true);
    expect(c1.reduce((sum, s) => sum + s.baseWeight, 0)).toBe(100);
  });

  it("percent wheel cycle 2+ can roll ±30% prizes with six wedges", () => {
    const slots = getPrizeSlotsForWheel("wheel_2", 2);
    expect(slots.length).toBe(6);
    const c2 = getConfiguredWheelSlices("wheel_2", "wheel_2_f2", 2);
    expect(c2.length).toBe(6);
    expect(c2.reduce((sum, s) => sum + s.baseWeight, 0)).toBe(100);
  });

  it("builder wheel has six +1 wedge choices (all wheels permanent)", () => {
    const slices = getConfiguredWheelSlices("wheel_7", "wheel_7");
    const labels = slices.map((s) => s.label);
    expect(labels).toHaveLength(6);
    expect(new Set(labels).size).toBe(6);
    expect(labels.every((l) => l.includes("+1"))).toBe(true);
    expect(slices.every((s) => s.payload.sliceDelta === 1)).toBe(true);
  });

  it("lucky_streak shifts odds on mixed-tag wheels when using database weights", () => {
    const slices = getConfiguredWheelSlices("wheel_6", "wheel_6");
    const base = getSliceProbabilities(slices, {
      ...DEFAULT_RESOLVE_CONTEXT,
      exactLandWeights: true,
    });
    const lucky = getSliceProbabilities(slices, {
      ...DEFAULT_RESOLVE_CONTEXT,
      exactLandWeights: true,
      positiveWeightMult: 1.15,
    });
    const rareOnly = (rows: typeof base) =>
      rows.filter((s) => s.weightTags.includes("rare") && !s.weightTags.includes("positive"));
    const rareBase = rareOnly(base).reduce((sum, s) => sum + s.probability, 0);
    const rareLucky = rareOnly(lucky).reduce((sum, s) => sum + s.probability, 0);
    const posBase = base
      .filter((s) => s.weightTags.includes("positive"))
      .reduce((sum, s) => sum + s.probability, 0);
    const posLucky = lucky
      .filter((s) => s.weightTags.includes("positive"))
      .reduce((sum, s) => sum + s.probability, 0);
    expect(posLucky).toBeGreaterThan(posBase);
    expect(rareLucky).toBeLessThan(rareBase);
  });

  it("risk wheel cycle 1 splits ~50% land on good vs bad wedges", () => {
    const slices = getConfiguredWheelSlices("wheel_3", "wheel_3", 1);
    expect(slices).toHaveLength(6);
    const goodLand = slices
      .filter((s) => s.weightTags?.includes("positive"))
      .reduce((sum, s) => sum + s.baseWeight, 0);
    const badLand = slices
      .filter((s) => !s.weightTags?.includes("positive"))
      .reduce((sum, s) => sum + s.baseWeight, 0);
    expect(goodLand).toBeGreaterThanOrEqual(48);
    expect(goodLand).toBeLessThanOrEqual(52);
    expect(badLand).toBeGreaterThanOrEqual(48);
    expect(badLand).toBeLessThanOrEqual(52);
    expect(slices.some((s) => s.label.includes("%"))).toBe(true);
  });

  it("cycle 1 money wheel is positive cash only", () => {
    const slices = getConfiguredWheelSlices("wheel_1", "wheel_1", 1);
    const cash = slices.filter((s) => s.kind === "money");
    const downside = slices.filter((s) => s.kind === "money_loss");
    expect(cash.length).toBeGreaterThanOrEqual(4);
    expect(downside.length).toBe(0);
    expect(slices.some((s) => s.label === "Nothing")).toBe(false);
  });

  it("cycle 1 money wheel shows distinct +$ labels (no cap-collapsed duplicates)", () => {
    const slices = getConfiguredWheelSlices("wheel_1", "wheel_1", 1);
    const gainLabels = slices
      .filter((s) => s.kind === "money")
      .map((s) => s.label);
    expect(new Set(gainLabels).size).toBe(gainLabels.length);
    const count120 = gainLabels.filter((l) => l === "+$120").length;
    expect(count120).toBeLessThanOrEqual(1);
  });

  it("drain wheel (W5) includes bank % cuts", () => {
    const slices = getConfiguredWheelSlices("wheel_5", "wheel_5", 1);
    expect(slices.some((s) => s.kind === "bank_cut" && (s.payload.bankPercent ?? 0) < 0)).toBe(
      true
    );
    expect(slices.reduce((sum, s) => sum + s.baseWeight, 0)).toBe(100);
  });

  it("wheel_1 is money-themed with same cash icon on +$ wedges", () => {
    const slices = getConfiguredWheelSlices("wheel_1", "wheel_1", 2);
    expect(slices).toHaveLength(6);
    expect(slices.every((s) => s.kind === "money")).toBe(true);
    expect(slices.filter((s) => s.kind === "money").every((s) => s.icon === "attach-money")).toBe(
      true
    );
    const sum = slices.reduce((s, row) => s + row.baseWeight, 0);
    expect(sum).toBe(100);
  });

  it("cycle 2 scales money wheel payouts above cycle 1", () => {
    const c1 = getConfiguredWheelSlices("wheel_1", "wheel_1", 1);
    const c2 = getConfiguredWheelSlices("wheel_1", "wheel_1_f2", 2);
    const maxGain = (rows: typeof c1) =>
      Math.max(
        0,
        ...rows
          .filter((s) => s.kind === "money")
          .map((s) => s.payload.moneyDelta ?? 0)
          .filter((n) => n > 0)
      );
    expect(maxGain(c2)).toBeGreaterThan(maxGain(c1));
  });

  it("lucky wheel layout is stable per run seed", () => {
    const a = getConfiguredWheelSlices("wheel_6", "wheel_6", { runId: "run-a", cycle: 1 });
    const b = getConfiguredWheelSlices("wheel_6", "wheel_6", { runId: "run-a", cycle: 1 });
    const c = getConfiguredWheelSlices("wheel_6", "wheel_6", { runId: "run-b", cycle: 1 });
    expect(a.map((s) => s.label)).toEqual(b.map((s) => s.label));
    expect(a.map((s) => s.label)).not.toEqual(c.map((s) => s.label));
  });

  it("perk wheel omits perks already owned", () => {
    const slices = getConfiguredWheelSlices("wheel_4", "wheel_4", {
      runId: "perk-test",
      cycle: 1,
      ownedPerks: ["lucky_streak", "gold_rush"],
    });
    const perkIds = slices
      .map((s) => s.payload.perkId)
      .filter((id): id is string => typeof id === "string");
    expect(perkIds).not.toContain("lucky_streak");
    expect(perkIds).not.toContain("gold_rush");
    expect(perkIds).toHaveLength(6);
  });

  it("every wheel uses distinct wedge colors per slot", () => {
    for (const id of FLOOR_WHEEL_ORDER) {
      const slices = getConfiguredWheelSlices(id, id);
      const colors = getWheelSegmentColors(slices);
      expect(new Set(colors).size).toBe(slices.length);
    }
  });

  it("each slot uses distinct partner icon ink", () => {
    const icons = SLICE_SLOT_PALETTES.map((p) => p.icon);
    expect(new Set(icons).size).toBe(icons.length);
    for (const slot of SLICE_SLOT_PALETTES) {
      expect(slot.icon).toMatch(/^#/);
      expect(slot.segment).not.toBe(slot.icon);
    }
  });

  it("all wheels validate to ~100% land chance and theme", () => {
    expect(validateAllWheels()).toEqual([]);
  });

  it("has nine wheels ending with chaos and boss", () => {
    expect(FLOOR_WHEEL_ORDER).toHaveLength(9);
    expect(FLOOR_WHEEL_ORDER[7]).toBe("wheel_8");
    expect(FLOOR_WHEEL_ORDER[8]).toBe("wheel_9");
    const chaos = getConfiguredWheelSlices("wheel_8", "wheel_8", { runId: "__validate__", cycle: 3 });
    expect(
      chaos.some(
        (s) =>
          s.payload.runEffectId === "corruption_spread" ||
          s.kind === "bank_wipe" ||
          s.kind === "bank_cut"
      )
    ).toBe(true);
    const finalWheel = getConfiguredWheelSlices("wheel_9", "wheel_9", {
      runId: "__validate__",
      cycle: 2,
      ownedPerks: ["lucky_money", "iron_reserve"],
    });
    const flatLosses = finalWheel.filter(
      (s) => s.kind === "money_loss" || (s.payload.moneyDelta ?? 0) < 0
    );
    const flatWins = finalWheel.filter((s) => (s.payload.moneyDelta ?? 0) > 0);
    expect(flatLosses.length).toBeGreaterThanOrEqual(3);
    expect(flatLosses.length).toBeGreaterThan(flatWins.length);
    expect(finalWheel.some((s) => s.payload.runEffectId === "boss_perk_tax")).toBe(false);
    expect(finalWheel.some((s) => s.payload.runEffectId === "boss_shield_break")).toBe(false);
    expect(finalWheel.some((s) => s.payload.runEffectId === "debt_bomb")).toBe(false);
    expect(finalWheel.some((s) => s.kind === "bank_cut")).toBe(false);
    expect(finalWheel.some((s) => s.kind === "bank_wipe")).toBe(false);

    const bossLate = getConfiguredWheelSlices("wheel_9", "wheel_9", {
      runId: "__boss_late__",
      cycle: 4,
      ownedPerks: [],
    });
    expect(bossLate.every((s) => s.kind === "money_loss" || s.kind === "neutral" || s.kind === "money" || s.kind === "bank_wipe")).toBe(true);
  });

  it("prints wheel_1 odds (manual inspect)", () => {
    const report = formatWheelOddsReport("wheel_1");
    // eslint-disable-next-line no-console
    console.log("\n" + report + "\n");
    expect(report).toContain("Money Wheel");
    expect(report).toContain("money");
  });
});
