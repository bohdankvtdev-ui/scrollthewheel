import type { PoolPick } from "./wheelPrizePools";

/**
 * “After cycle 3” = first appearance on cycle 4+ (you cleared cycles 1–3).
 * Rare swing outcomes — jackpots, wipe, curses — low weight so they surprise, not dominate.
 */
export const LATE_CYCLE_MIN = 4;

/** Tiny chance of huge upside (any wheel that merges this pool). */
export const LATE_CYCLE_JACKPOT_SPIKES: PoolPick[] = [
  { prize: "money_1000", weight: 2, minCycle: LATE_CYCLE_MIN },
  { prize: "money_800", weight: 3, minCycle: LATE_CYCLE_MIN },
  { prize: "mega_money", weight: 2, minCycle: 5 },
  { prize: "bank_double", weight: 2, minCycle: LATE_CYCLE_MIN },
];

/** Tiny chance of brutal downside — drain / chaos / risk / perk traps. */
export const LATE_CYCLE_HARM_SPIKES: PoolPick[] = [
  { prize: "bank_wipe", weight: 4, minCycle: LATE_CYCLE_MIN },
  { prize: "debt_bomb", weight: 3, minCycle: LATE_CYCLE_MIN },
  { prize: "mega_curse", weight: 2, minCycle: LATE_CYCLE_MIN },
  { prize: "debuff_debt_mark", weight: 3, minCycle: LATE_CYCLE_MIN },
  { prize: "debuff_rusted", weight: 3, minCycle: LATE_CYCLE_MIN },
  { prize: "corruption_spread", weight: 2, minCycle: LATE_CYCLE_MIN },
  { prize: "doom_spiral", weight: 1, minCycle: 5 },
  { prize: "bank_cut_75", weight: 2, minCycle: LATE_CYCLE_MIN },
];

/** Perk wheel — “bad draw” disguised as offers (cycle 4+). */
export const LATE_CYCLE_PERK_HARM: PoolPick[] = [
  { prize: "debuff_debt_mark", weight: 4, minCycle: LATE_CYCLE_MIN },
  { prize: "debuff_rusted", weight: 4, minCycle: LATE_CYCLE_MIN },
  { prize: "mega_curse", weight: 3, minCycle: LATE_CYCLE_MIN },
  { prize: "debt_bomb", weight: 2, minCycle: 5 },
];

export function mergeLateCycleSpikes(pool: readonly PoolPick[]): PoolPick[] {
  return [...pool, ...LATE_CYCLE_JACKPOT_SPIKES, ...LATE_CYCLE_HARM_SPIKES];
}

export function isLateCycle(cycle: number): boolean {
  return cycle >= LATE_CYCLE_MIN;
}
