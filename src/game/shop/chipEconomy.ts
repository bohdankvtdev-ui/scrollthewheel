import { getCycleParams } from "../gdd";
import type { RunState } from "../../schemas";
import { applyChipGain } from "../runState/chipsScoring";

/** In-run chips — earned from spins, spent in shop. */
export function getSpendableChips(run: RunState): number {
  return Math.max(0, run.chipsEarnedThisRun ?? 0);
}

export function spendChips(run: RunState, amount: number): RunState | null {
  const chips = getSpendableChips(run);
  if (amount > chips) return null;
  return {
    ...run,
    chipsEarnedThisRun: chips - amount,
  };
}

export function grantChipsInRun(run: RunState, amount: number): RunState {
  return applyChipGain(run as RunState & { chipsEarnedThisRun: number }, amount) as RunState;
}

/** Shop / reroll price in chips (cycle scaling + Coupon King). */
export function shopChipCost(run: RunState, base: number): number {
  const cycle = getCycleParams(run.floor);
  let cost = Math.floor(base * cycle.shopPriceMult);
  if (run.perks.includes("coupon_king")) {
    cost = Math.floor(cost * 0.85);
  }
  return Math.max(1, cost);
}
