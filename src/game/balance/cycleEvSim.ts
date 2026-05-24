import type { RunState } from "../../schemas";
import { buildSliceFromPrizeSlot } from "../wheels/database/sliceFromPrize";
import { buildPrizeSlotsForWheel } from "../wheels/database/wheelPrizeBuilder";
import { FLOOR_WHEEL_ORDER, type FloorWheelOrderId } from "../wheels/database/wheelDatabase";
import { computeSliceMoneyDelta } from "../../utils/sliceMoneyDisplay";
import { mulberry32 } from "../wheels/database/prizeRng";

export type WheelEvSnapshot = {
  wheelId: FloorWheelOrderId;
  cycle: number;
  bank: number;
  meanDelta: number;
  medianDelta: number;
  pctNegativeSlices: number;
  samples: number;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

function isNegativeMoneySlice(delta: number): boolean {
  return delta < 0;
}

function sampleLandIndex(weights: number[], rng: () => number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

function runStateForBank(bank: number, cycle: number): RunState {
  return {
    money: bank,
    floor: cycle,
    perks: [],
    debuffs: [],
    relics: [],
    history: [],
    phase: "active",
    wheelIndex: 0,
    chipsEarnedThisRun: 0,
    winStreak: 0,
  } as RunState;
}

/**
 * Monte Carlo EV for one built wheel layout at a reference bank.
 */
export function simulateWheelEv(
  wheelId: FloorWheelOrderId,
  cycle: number,
  bank: number,
  samples = 2000,
  seed = 0xdecaf
): WheelEvSnapshot {
  const slots = buildPrizeSlotsForWheel(wheelId, {
    runId: `sim_${wheelId}_${cycle}`,
    cycle,
  });
  const slices = slots.map((slot, i) =>
    buildSliceFromPrizeSlot(slot, wheelId, i, cycle)
  );
  const weights = slices.map((s) => s.baseWeight);
  const wheelIndex = FLOOR_WHEEL_ORDER.indexOf(wheelId);
  const run = runStateForBank(bank, cycle);
  const rng = mulberry32(seed + wheelIndex * 997 + cycle * 131);

  const deltas: number[] = [];
  let negativeSlices = 0;
  for (const slice of slices) {
    const d = computeSliceMoneyDelta(run, slice, wheelIndex);
    if (d < 0) negativeSlices += 1;
  }

  for (let i = 0; i < samples; i++) {
    const idx = sampleLandIndex(weights, rng);
    const slice = slices[idx]!;
    deltas.push(computeSliceMoneyDelta(run, slice, wheelIndex));
  }

  const meanDelta = deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length);

  return {
    wheelId,
    cycle,
    bank,
    meanDelta,
    medianDelta: median(deltas),
    pctNegativeSlices: slices.length > 0 ? (negativeSlices / slices.length) * 100 : 0,
    samples,
  };
}

export function simulateCycle1EarlyChipsFromWins(
  bank = 100,
  samples = 500
): { meanChips: number; p90: number } {
  const w1 = simulateWheelEv("wheel_1", 1, bank, samples, 0x1001);
  const w2 = simulateWheelEv("wheel_2", 1, bank, samples, 0x1002);
  const earlyFlat = 6 + 8;
  const chipSamples: number[] = [];
  const rng = mulberry32(0xc411);

  for (let i = 0; i < samples; i++) {
    let chips = earlyFlat;
    if (w1.meanDelta > 0) chips += Math.max(1, Math.floor(w1.meanDelta / 120));
    if (w2.meanDelta > 0) chips += Math.max(0, Math.floor(Math.abs(w2.meanDelta) / 120));
    chipSamples.push(chips + Math.floor(rng() * 3));
  }

  chipSamples.sort((a, b) => a - b);
  const meanChips = chipSamples.reduce((a, b) => a + b, 0) / chipSamples.length;
  const p90 = chipSamples[Math.floor(chipSamples.length * 0.9)] ?? meanChips;
  return { meanChips, p90 };
}
