/**
 * Infinite cycle advancement — money and risk ramp forever; soft tiers every N cycles.
 */
export const CYCLE_ADVANCEMENT = {
  /** Every N cycles = +1 advancement tier */
  tierEveryNCycles: 3,
  /** Extra money compound per tier (on top of base cycleEconomy) */
  moneyBonusPerTier: 0.04,
  /** Extra negative slice pressure per tier */
  riskBiasPerTier: 0.06,
  /** Pool wheels treat minCycle as if cycle were this many higher (caps at pool max) */
  poolDepthPerTier: 1,
  /** Max tiers counted for formulas (soft cap — still scales past via cycle number) */
  tierSoftCap: 20,
} as const;

export type CycleAdvancement = {
  tier: number;
  /** Multiplier stacked on positive money deltas */
  moneyMult: number;
  /** Added to wheel negative bias */
  riskBias: number;
  /** For pool builder: effective cycle when picking prizes */
  effectivePoolCycle: number;
  label: string;
};

export function getAdvancementTier(cycleLevel: number): number {
  const c = Math.max(1, cycleLevel);
  const raw = Math.floor((c - 1) / CYCLE_ADVANCEMENT.tierEveryNCycles);
  return Math.min(CYCLE_ADVANCEMENT.tierSoftCap, raw);
}

export function getCycleAdvancement(cycleLevel: number): CycleAdvancement {
  const cycle = Math.max(1, cycleLevel);
  const tier = getAdvancementTier(cycle);
  return {
    tier,
    moneyMult: 1 + tier * CYCLE_ADVANCEMENT.moneyBonusPerTier,
    riskBias: tier * CYCLE_ADVANCEMENT.riskBiasPerTier,
    effectivePoolCycle: cycle + tier * CYCLE_ADVANCEMENT.poolDepthPerTier,
    label: tier === 0 ? `Cycle ${cycle}` : `Cycle ${cycle} · Tier ${tier + 1}`,
  };
}

/** Long-run pressure beyond advancement tiers (smooth, no hard stop). */
export function getInfinitePressure(cycleLevel: number): {
  negativeWeightMult: number;
  stakesMult: number;
} {
  const c = Math.max(1, cycleLevel);
  const log = Math.log10(c + 9);
  return {
    negativeWeightMult: 1 + (c - 1) * 0.04 + log * 0.08,
    stakesMult: 1 + (c - 1) * 0.03 + log * 0.05,
  };
}
