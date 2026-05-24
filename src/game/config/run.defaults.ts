import type { SliceCount } from "../../schemas";

/** Core run constants — no imports from loop/wheels (avoids circular init). */
export const RUN_DEFAULTS = {
  /** Run begins at $0 — first money wedge builds the bank. Bankruptcy after at least one spin. */
  startingMoney: 0,
  /** Spendable in perk shop during the run */
  startingChips: 0,
  startingFloor: 1,
  startingSliceCapacity: 6 as SliceCount,
  maxSliceCapacity: 24 as SliceCount,
  minSliceCapacity: 6 as SliceCount,
  historyMaxEvents: 50,
  /** Run ends when bank is $0 or below. */
  bankruptcyThreshold: 0,
} as const;

export type RunDefaults = typeof RUN_DEFAULTS;
