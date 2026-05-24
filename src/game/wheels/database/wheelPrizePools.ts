import type { PrizeCatalogId } from "./prizeCatalog";
import type { WheelConfigId } from "./types";
import { LATE_CYCLE_MIN } from "./lateCycleEvents";

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

/** Cycle 1 wheel 1 — positive flat $ only (first wheel teaches gains, no −$). */
export const MONEY_WHEEL_CYCLE1_POOL: PoolPick[] = [
  { prize: "money_25", weight: 14 },
  { prize: "money_30", weight: 14 },
  { prize: "money_50", weight: 14 },
  { prize: "money_80", weight: 13 },
  { prize: "money_100", weight: 11 },
  { prize: "money_120", weight: 6 },
];

/** Later cycles — tiered weights (rarer high rolls). */
export const MONEY_TIER_WEIGHTS: Partial<Record<PrizeCatalogId, number>> = {
  money_50: 12,
  money_80: 12,
  money_100: 11,
  money_120: 9,
  money_150: 8,
  money_200: 6,
};

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
  { prize: "money_500", weight: 10, minCycle: 2 },
  { prize: "money_300", weight: 12, minCycle: 2 },
  { prize: "money_200", weight: 14, minCycle: 1 },
  { prize: "money_150", weight: 12, minCycle: 1 },
  { prize: "perk_lucky_streak", weight: 10, minCycle: 1 },
  { prize: "perk_vip_roller", weight: 8, minCycle: 2 },
  { prize: "perk_gold_rush", weight: 7, minCycle: 1 },
  { prize: "relic_lucky_coin", weight: 9, minCycle: 1 },
  { prize: "relic_void_lens", weight: 6, minCycle: 3 },
  { prize: "bank_double", weight: 3, minCycle: 3 },
  { prize: "money_800", weight: 3, minCycle: LATE_CYCLE_MIN },
  { prize: "money_1000", weight: 2, minCycle: LATE_CYCLE_MIN },
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
  { prize: "bank_loss_30", weight: 16, minCycle: 1 },
  { prize: "bank_loss_15", weight: 16, minCycle: 1 },
  { prize: "bank_loss_10", weight: 14, minCycle: 1 },
  { prize: "bank_loss_5", weight: 10, minCycle: 1 },
  { prize: "bank_loss_25", weight: 14, minCycle: 2 },
  { prize: "bank_loss_40", weight: 12, minCycle: 4 },
  { prize: "money_loss_100", weight: 12, minCycle: 2 },
  { prize: "money_loss_60", weight: 14, minCycle: 1 },
  { prize: "money_loss_40", weight: 10, minCycle: 1 },
  { prize: "debuff_debt_mark", weight: 8, minCycle: 2 },
  { prize: "bank_cut_quarter", weight: 10, minCycle: 2 },
];

/** @deprecated — use RISK_GOOD_POOL + RISK_BAD_POOL via buildRiskWheel */
export const RISK_POOL: PoolPick[] = [...RISK_GOOD_POOL, ...RISK_BAD_POOL];

/** Harsh land weights for Drain mini-boss (6 wedges). */
export const DRAIN_LAND_SHAPE = [30, 24, 19, 13, 9, 5] as const;

export const DRAIN_POOL: PoolPick[] = [
  { prize: "bank_loss_10", weight: 18, minCycle: 1 },
  { prize: "bank_loss_15", weight: 16, minCycle: 1 },
  { prize: "bank_loss_25", weight: 14, minCycle: 2 },
  { prize: "bank_loss_30", weight: 12, minCycle: 3 },
  { prize: "bank_cut_ten", weight: 16, minCycle: 1 },
  { prize: "bank_cut_quarter", weight: 14, minCycle: 1 },
  { prize: "bank_cut_half", weight: 10, minCycle: 3 },
  { prize: "bank_cut_75", weight: 5, minCycle: 4 },
  { prize: "money_loss_20", weight: 12, minCycle: 1 },
  { prize: "money_loss_40", weight: 12, minCycle: 1 },
  { prize: "money_loss_60", weight: 10, minCycle: 2 },
  { prize: "money_loss_80", weight: 10, minCycle: 2 },
  { prize: "money_loss_100", weight: 8, minCycle: 2 },
  { prize: "money_50", weight: 2, minCycle: 4 },
  { prize: "money_80", weight: 1, minCycle: 5 },
  { prize: "debuff_rusted", weight: 14, minCycle: 2 },
  { prize: "debuff_debt_mark", weight: 10, minCycle: 2 },
  { prize: "debt_bomb", weight: 6, minCycle: 2 },
  { prize: "drain_tax", weight: 8, minCycle: 2 },
  { prize: "mega_curse", weight: 3, minCycle: 4 },
  { prize: "boss_ghost", weight: 6, minCycle: 3 },
  { prize: "lock_drain", weight: 4, minCycle: 3 },
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
  { prize: "bank_cut_75", weight: 14, minCycle: 2 },
  { prize: "bank_cut_half", weight: 12, minCycle: 2 },
  { prize: "bank_cut_quarter", weight: 12, minCycle: 2 },
  { prize: "corruption_spread", weight: 12, minCycle: 2 },
  { prize: "money_loss_150", weight: 14, minCycle: 2 },
  { prize: "money_loss_100", weight: 12, minCycle: 2 },
  { prize: "money_loss_60", weight: 10, minCycle: 2 },
  { prize: "neutral_nothing", weight: 8, minCycle: 2 },
  { prize: "money_300", weight: 8, minCycle: 3 },
];

/**
 * Final wheel (wheel_9) — flat −$ only; rare LOSE ALL from cycle 4+; tiny relief pays late.
 * No shield break, debt bomb, % cuts, or debuffs on the boss disc.
 */
export const FINAL_WHEEL_POOL: PoolPick[] = [
  { prize: "money_loss_60", weight: 26 },
  { prize: "money_loss_80", weight: 28 },
  { prize: "money_loss_100", weight: 28 },
  { prize: "money_loss_150", weight: 26 },
  { prize: "money_loss_200", weight: 22, minCycle: 2 },
  { prize: "money_loss_40", weight: 18 },
  { prize: "money_loss_50", weight: 16 },
  { prize: "bank_wipe", weight: 4, minCycle: LATE_CYCLE_MIN },
  { prize: "neutral_nothing", weight: 4, minCycle: 2 },
  { prize: "boss_pay_100", weight: 1, minCycle: 4 },
  { prize: "boss_pay_150", weight: 1, minCycle: 5 },
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
