/**
 * Which perks change **spin odds** vs **payout after** the slice lands.
 * Spin odds: `buildResolveContext` + `ProbabilityResolver`.
 * Payout: `PerkSystem.applyMoneyDelta` + `jokerEngine` onGainMoney.
 */
export const SPIN_WEIGHT_PERKS = {
  lucky_streak: { positiveWeightMult: 1.15, description: "+15% weight on positive-tagged slices" },
  hot_table: { rareTagMult: 1.1, description: "+10% weight on rare-tagged slices" },
} as const;

export const PAYOUT_ONLY_PERKS = {
  gold_rush: { moneyMult: 1.25, description: "+25% cash from money slices (after landing)" },
  high_roller: { moneyMult: 1.15, description: "+15% cash from money slices" },
  vip_roller: { moneyMult: 1.2, description: "+20% cash from money slices" },
  compounder: { description: "+5% cash per floor cleared" },
  double_down: { description: "Next cash slice ×2" },
} as const;
