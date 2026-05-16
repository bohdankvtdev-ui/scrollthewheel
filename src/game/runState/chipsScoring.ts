import type { RunState } from "./types";

/**
 * Meta chips (global score) — not spendable in-run.
 * Money is run currency; chips reward skill / depth.
 */
export function computeRunChipAward(run: RunState): number {
  const floor = Math.max(1, run.floor);
  const fromFloor = floor * 12;
  const fromWheels = run.history.length * 3;
  const fromMoney = Math.floor(Math.max(0, run.money) / 150);
  const fromPerks = run.perks.length * 4;
  const earned = run.chipsEarnedThisRun ?? 0;

  let total = fromFloor + fromWheels + fromMoney + fromPerks + earned;

  if (run.phase === "won") {
    total += 25 + floor * 10;
  }

  return Math.max(0, total);
}

export function applyChipGain(run: RunState, amount: number): RunState {
  if (amount <= 0) return run;
  const mult = run.modifiers?.chipGainMult ?? 1;
  const delta = Math.floor(amount * mult);
  return {
    ...run,
    chipsEarnedThisRun: (run.chipsEarnedThisRun ?? 0) + delta,
  };
}
