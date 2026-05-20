import type { PrizeCatalogId } from "./prizeCatalog";
import type { WheelConfigId } from "./types";

export type PoolPick = {
  prize: PrizeCatalogId | (string & {});
  weight: number;
  minCycle?: number;
  maxCycle?: number;
};

/** Standard 6-slice land-% shape (sums to 100 when used with distributeLandChances). */
export const LAND_SHAPE_6 = [22, 20, 18, 16, 14, 10] as const;
export const LAND_SHAPE_6_EVEN = [18, 17, 17, 17, 16, 15] as const;
export const LAND_SHAPE_LUCKY = [14, 16, 18, 18, 17, 17] as const;

/** Cycle 1 base $ amounts — scaled by cycleEconomy before display */
export const MONEY_TIER_PRIZES: readonly { prize: PrizeCatalogId; base: number }[] = [
  { prize: "money_50", base: 50 },
  { prize: "money_80", base: 80 },
  { prize: "money_100", base: 100 },
  { prize: "money_120", base: 120 },
  { prize: "money_150", base: 150 },
  { prize: "money_200", base: 200 },
];

/** Perk wheel — early-run helpers first; capstones gated by cycle in builder. */
export const PERK_WHEEL_POOL: PrizeCatalogId[] = [
  "perk_lucky_money",
  "perk_lucky_percent",
  "perk_lucky_streak",
  "perk_lucky_perk",
  "perk_green_fever",
  "perk_gold_rush",
  "perk_iron_reserve",
  "perk_ante_insurance",
  "perk_chip_drip",
  "perk_money_stream",
  "perk_safe_harbor",
  "perk_high_roller",
  "perk_hot_table",
  "perk_vip_roller",
  "perk_double_down",
  "perk_hex_ward",
  "perk_purify_touch",
  "perk_coupon_king",
  "perk_final_guard",
  "perk_clutch_cash",
  "perk_compounder",
  "perk_final_tax_shield",
];

export const LUCKY_POOL: PoolPick[] = [
  { prize: "money_1000", weight: 10, minCycle: 1 },
  { prize: "money_800", weight: 8, minCycle: 2 },
  { prize: "money_500", weight: 12, minCycle: 1 },
  { prize: "money_300", weight: 14, minCycle: 1 },
  { prize: "money_200", weight: 12, minCycle: 1 },
  { prize: "perk_lucky_streak", weight: 10, minCycle: 1 },
  { prize: "perk_vip_roller", weight: 8, minCycle: 2 },
  { prize: "perk_gold_rush", weight: 8, minCycle: 1 },
  { prize: "relic_lucky_coin", weight: 10, minCycle: 1 },
  { prize: "relic_void_lens", weight: 6, minCycle: 3 },
  { prize: "bank_double", weight: 6, minCycle: 3 },
];

/** Risk wheel — high +% bank wins (cycle-scaled like percent wheel). */
export const RISK_GOOD_POOL: PoolPick[] = [
  { prize: "bank_gain_30", weight: 14, minCycle: 1 },
  { prize: "bank_gain_25", weight: 12, minCycle: 2 },
  { prize: "bank_gain_15", weight: 14, minCycle: 1 },
  { prize: "bank_gain_10", weight: 12, minCycle: 1 },
  { prize: "bank_gain_5", weight: 10, minCycle: 1 },
  { prize: "bank_gain_40", weight: 10, minCycle: 4 },
  { prize: "money_300", weight: 8, minCycle: 2 },
  { prize: "money_200", weight: 10, minCycle: 1 },
  { prize: "money_150", weight: 12, minCycle: 1 },
];

/** Risk wheel — matching −% / −$ / curses (other half of the wheel). */
export const RISK_BAD_POOL: PoolPick[] = [
  { prize: "bank_loss_30", weight: 14, minCycle: 1 },
  { prize: "bank_loss_15", weight: 14, minCycle: 1 },
  { prize: "bank_loss_10", weight: 12, minCycle: 1 },
  { prize: "bank_loss_5", weight: 10, minCycle: 1 },
  { prize: "bank_loss_25", weight: 12, minCycle: 2 },
  { prize: "bank_loss_40", weight: 10, minCycle: 4 },
  { prize: "money_loss_100", weight: 12, minCycle: 2 },
  { prize: "money_loss_60", weight: 14, minCycle: 1 },
  { prize: "money_loss_40", weight: 10, minCycle: 1 },
  { prize: "debuff_debt_mark", weight: 10, minCycle: 2 },
  { prize: "bank_cut_quarter", weight: 10, minCycle: 2 },
];

/** @deprecated — use RISK_GOOD_POOL + RISK_BAD_POOL via buildRiskWheel */
export const RISK_POOL: PoolPick[] = [...RISK_GOOD_POOL, ...RISK_BAD_POOL];

export const DRAIN_POOL: PoolPick[] = [
  { prize: "money_loss_10", weight: 10, minCycle: 1 },
  { prize: "money_loss_15", weight: 10, minCycle: 1 },
  { prize: "money_loss_20", weight: 12, minCycle: 1 },
  { prize: "money_loss_25", weight: 12, minCycle: 1 },
  { prize: "money_loss_40", weight: 10, minCycle: 1 },
  { prize: "bank_cut_ten", weight: 14, minCycle: 1 },
  { prize: "money_100", weight: 6, minCycle: 3 },
  { prize: "money_80", weight: 6, minCycle: 3 },
  { prize: "money_50", weight: 5, minCycle: 3 },
  { prize: "money_loss_80", weight: 18, minCycle: 2 },
  { prize: "money_loss_150", weight: 16, minCycle: 2 },
  { prize: "money_loss_100", weight: 12, minCycle: 2 },
  { prize: "debt_bomb", weight: 14, minCycle: 2 },
  { prize: "debuff_rusted", weight: 12, minCycle: 2 },
  { prize: "bank_cut_quarter", weight: 14, minCycle: 2 },
  { prize: "bank_cut_ten", weight: 10, minCycle: 2 },
  { prize: "lock_drain", weight: 12, minCycle: 2 },
  { prize: "boss_ghost", weight: 8, minCycle: 3 },
];

/** Builder wheel — six fixed choices; each grants +1 wedge on every wheel (permanent). */
export const BUILDER_WEDGE_PRIZES = [
  "builder_wedge_money",
  "builder_wedge_percent",
  "builder_wedge_perk",
  "builder_wedge_drain",
  "builder_wedge_lucky",
  "builder_wedge_chaos",
] as const satisfies readonly PrizeCatalogId[];

/** @deprecated use BUILDER_WEDGE_PRIZES */
export const BUILDER_POOL: PoolPick[] = BUILDER_WEDGE_PRIZES.map((prize) => ({
  prize,
  weight: 1,
}));

export const CHAOS_POOL: PoolPick[] = [
  { prize: "money_loss_15", weight: 12, minCycle: 1 },
  { prize: "money_loss_20", weight: 12, minCycle: 1 },
  { prize: "money_loss_25", weight: 10, minCycle: 1 },
  { prize: "bank_cut_ten", weight: 14, minCycle: 1 },
  { prize: "neutral_calm", weight: 8, minCycle: 1 },
  { prize: "money_loss_10", weight: 8, minCycle: 1 },
  { prize: "money_150", weight: 8, minCycle: 3 },
  { prize: "money_100", weight: 8, minCycle: 3 },
  { prize: "money_80", weight: 6, minCycle: 3 },
  { prize: "money_50", weight: 6, minCycle: 3 },
  { prize: "bank_wipe", weight: 10, minCycle: 3 },
  { prize: "bank_cut_75", weight: 14, minCycle: 2 },
  { prize: "bank_cut_half", weight: 12, minCycle: 2 },
  { prize: "bank_cut_quarter", weight: 12, minCycle: 2 },
  { prize: "debt_bomb", weight: 14, minCycle: 2 },
  { prize: "corruption_spread", weight: 12, minCycle: 2 },
  { prize: "money_loss_150", weight: 14, minCycle: 2 },
  { prize: "money_loss_100", weight: 12, minCycle: 2 },
  { prize: "money_loss_60", weight: 10, minCycle: 2 },
  { prize: "neutral_nothing", weight: 8, minCycle: 2 },
  { prize: "money_300", weight: 8, minCycle: 2 },
];

/**
 * Final wheel (wheel_9) — mostly flat $ losses; rare small flat wins; bank/perk taxes.
 */
export const FINAL_WHEEL_POOL: PoolPick[] = [
  { prize: "money_loss_60", weight: 16 },
  { prize: "money_loss_80", weight: 18 },
  { prize: "money_loss_100", weight: 18 },
  { prize: "money_loss_150", weight: 16 },
  { prize: "money_loss_200", weight: 14, minCycle: 2 },
  { prize: "money_loss_40", weight: 12 },
  { prize: "money_loss_50", weight: 10 },
  { prize: "boss_perk_tax", weight: 14 },
  { prize: "boss_overhead", weight: 12 },
  { prize: "boss_shield_break", weight: 12 },
  { prize: "bank_cut_quarter", weight: 14 },
  { prize: "bank_cut_half", weight: 12 },
  { prize: "bank_cut_75", weight: 10, minCycle: 2 },
  { prize: "debt_bomb", weight: 12 },
  { prize: "debuff_debt_mark", weight: 10 },
  { prize: "debuff_rusted", weight: 8, minCycle: 2 },
  { prize: "mega_curse", weight: 8, minCycle: 2 },
  { prize: "bank_wipe", weight: 5, minCycle: 3 },
  { prize: "doom_spiral", weight: 5, minCycle: 4 },
  { prize: "neutral_nothing", weight: 10, minCycle: 2 },
  { prize: "boss_pay_100", weight: 5 },
  { prize: "boss_pay_150", weight: 3, minCycle: 2 },
];

/** @deprecated — use FINAL_WHEEL_POOL for wheel_9 */
export const BOSS_POOL: PoolPick[] = FINAL_WHEEL_POOL;

export const WHEEL_POOL_BY_CONFIG: Partial<Record<WheelConfigId, PoolPick[]>> = {
  wheel_1: [], // built from MONEY_TIER_PRIZES
  wheel_3: RISK_POOL,
  wheel_4: [], // perk builder
  wheel_5: DRAIN_POOL,
  wheel_6: LUCKY_POOL,
  wheel_7: BUILDER_POOL,
  wheel_8: CHAOS_POOL,
  wheel_9: FINAL_WHEEL_POOL,
};
