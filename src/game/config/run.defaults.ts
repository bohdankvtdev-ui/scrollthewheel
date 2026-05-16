/** Core run constants — tune economy and pacing here. */
export const RUN_DEFAULTS = {
  startingMoney: 0,
  startingFloor: 1,
  startingSliceCapacity: 6 as const,
  maxSliceCapacity: 12 as const,
  minSliceCapacity: 6 as const,
  historyMaxEvents: 50,
  /** Lose run when bank hits this or below */
  bankruptcyThreshold: -1,
} as const;

export type RunDefaults = typeof RUN_DEFAULTS;
