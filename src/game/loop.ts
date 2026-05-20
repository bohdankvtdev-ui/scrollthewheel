/**
 * Game loop database — wheels rotation, economy, infinite scaling, shop tree.
 */
import type { IconFamily, InfiniteScalingParams, SliceCount, WheelDefinition, WheelRole } from "../schemas";
import { FLOOR_WHEEL_COUNT, prototypeToWheelDefinitions } from "./wheels";

export {
  GDD_PACING,
  GDD_LOOP_SUMMARY,
  PRIZE_TAXONOMY,
  getCycleParams,
  getWheelDifficultyBias,
} from "./gdd";

export const RUN_DEFAULTS = {
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

export const INFINITE_SCALING = {
  negativeWeightStep: 0.15,
  stakesMultStep: 0.12,
  moneyInflationStep: 0.065,
  /** Extra negative bias per wheel index within a floor (0–8) */
  wheelIndexNegativeStep: 0.035,
  sliceCapacityBonusFromFloor: 4,
  sliceCapacityBonus: 0,
} as const;

/** Ante labels — Balatro-style escalation. */
export function getBlindLabel(floor: number): string {
  const f = Math.max(1, floor);
  return `Cycle ${f}`;
}

export function getScalingParams(floor: number): InfiniteScalingParams {
  const f = Math.max(1, floor);
  const c = INFINITE_SCALING;
  return {
    floor: f,
    blindLabel: getBlindLabel(f),
    negativeWeightMult: 1 + (f - 1) * c.negativeWeightStep,
    stakesMult: 1 + (f - 1) * c.stakesMultStep,
    moneyInflationMult: 1 + (f - 1) * c.moneyInflationStep,
    sliceCapacityBonus: f >= c.sliceCapacityBonusFromFloor ? c.sliceCapacityBonus : 0,
  };
}

export function applySliceCapacityFromScaling(current: SliceCount, params: InfiniteScalingParams): SliceCount {
  const next = current + params.sliceCapacityBonus;
  return Math.min(
    RUN_DEFAULTS.maxSliceCapacity,
    Math.max(RUN_DEFAULTS.minSliceCapacity, next)
  ) as SliceCount;
}

/** 9-wheel cycle (see `game/wheels/database/wheelDatabase.ts`). */
export const WHEEL_ROTATION: WheelDefinition[] = prototypeToWheelDefinitions(1);

export const WHEEL_COUNT = FLOOR_WHEEL_COUNT;
export const RUN_PIPELINE = WHEEL_ROTATION;

export function getPipelineForFloor(floor: number): WheelDefinition[] {
  return prototypeToWheelDefinitions(floor);
}

export type WheelStageMeta = {
  role: WheelRole;
  label: string;
  vibe: string;
  icon: string;
  iconFamily: IconFamily;
  accent: string;
  pageTint: string;
};

export const WHEEL_STAGES: Record<WheelRole, WheelStageMeta> = {
  base: { role: "base", label: "W1", vibe: "Cash — build bank", icon: "payments", iconFamily: "MaterialIcons", accent: "#FFE94D", pageTint: "#1a1428" },
  yield: { role: "yield", label: "W2", vibe: "Percent — % of bank", icon: "percent", iconFamily: "MaterialIcons", accent: "#4ADE80", pageTint: "#121f18" },
  risk: { role: "risk", label: "W3", vibe: "Risk — big swings", icon: "warning", iconFamily: "MaterialIcons", accent: "#FF6B9D", pageTint: "#22121c" },
  stabilizer: { role: "stabilizer", label: "W4", vibe: "Perk — pick modifiers", icon: "stars", iconFamily: "MaterialIcons", accent: "#22D3EE", pageTint: "#101820" },
  mini_boss: { role: "mini_boss", label: "W5", vibe: "Drain — cuts bank", icon: "trending-down", iconFamily: "MaterialIcons", accent: "#FF2D55", pageTint: "#241018" },
  jackpot: { role: "jackpot", label: "W6", vibe: "Lucky — jackpots", icon: "emoji-events", iconFamily: "MaterialIcons", accent: "#FACC15", pageTint: "#221c08" },
  power: { role: "power", label: "W7", vibe: "Builder — chips", icon: "build", iconFamily: "MaterialIcons", accent: "#C4B5FD", pageTint: "#1a1228" },
  deck: { role: "deck", label: "W8", vibe: "Chaos — wild mix", icon: "shuffle", iconFamily: "MaterialIcons", accent: "#22D3EE", pageTint: "#121a22" },
  preparation: { role: "preparation", label: "Prep", vibe: "Shop before boss", icon: "storefront", iconFamily: "MaterialIcons", accent: "#C4B5FD", pageTint: "#18122a" },
  boss: { role: "boss", label: "W9", vibe: "Final — flat $ & perk tax", icon: "gavel", iconFamily: "MaterialIcons", accent: "#FF2D55", pageTint: "#1c0810" },
};

export type ShopPerkNode = {
  perkId: string;
  cost: number;
  requires: string[];
  tier: number;
  column: number;
};

/** Costs are in chips (not run money). */
export const SHOP_PERK_TREE: ShopPerkNode[] = [
  { perkId: "lucky_money", cost: 5, requires: [], tier: 0, column: 0 },
  { perkId: "lucky_perk", cost: 5, requires: [], tier: 0, column: 1 },
  { perkId: "lucky_percent", cost: 5, requires: [], tier: 0, column: 2 },
  { perkId: "lucky_streak", cost: 6, requires: [], tier: 0, column: 3 },
  { perkId: "iron_reserve", cost: 6, requires: [], tier: 0, column: 4 },
  { perkId: "ante_insurance", cost: 4, requires: [], tier: 0, column: 5 },
  { perkId: "green_fever", cost: 5, requires: [], tier: 0, column: 6 },
  { perkId: "chip_drip", cost: 5, requires: [], tier: 0, column: 7 },
  { perkId: "high_roller", cost: 10, requires: ["lucky_money"], tier: 1, column: 0 },
  { perkId: "gold_rush", cost: 11, requires: ["lucky_money"], tier: 1, column: 1 },
  { perkId: "clutch_cash", cost: 11, requires: ["gold_rush"], tier: 1, column: 2 },
  { perkId: "safe_harbor", cost: 11, requires: ["iron_reserve"], tier: 1, column: 3 },
  { perkId: "drain_ward", cost: 8, requires: ["iron_reserve"], tier: 1, column: 4 },
  { perkId: "chaos_ward", cost: 8, requires: ["iron_reserve"], tier: 1, column: 5 },
  { perkId: "final_guard", cost: 10, requires: ["iron_reserve"], tier: 1, column: 6 },
  { perkId: "deep_pockets", cost: 9, requires: ["ante_insurance"], tier: 1, column: 7 },
  { perkId: "hot_table", cost: 13, requires: ["gold_rush"], tier: 2, column: 0 },
  { perkId: "coupon_king", cost: 13, requires: ["high_roller"], tier: 2, column: 1 },
  { perkId: "vip_roller", cost: 16, requires: ["lucky_percent"], tier: 2, column: 2 },
  { perkId: "double_down", cost: 18, requires: ["gold_rush", "iron_reserve"], tier: 2, column: 3 },
  { perkId: "streak_spark", cost: 12, requires: ["lucky_streak"], tier: 2, column: 4 },
  { perkId: "jackpot_hunter", cost: 14, requires: ["hot_table"], tier: 2, column: 5 },
  { perkId: "final_tax_shield", cost: 15, requires: ["final_guard", "coupon_king"], tier: 2, column: 6 },
  { perkId: "compounder", cost: 22, requires: ["hot_table", "coupon_king"], tier: 3, column: 1 },
  { perkId: "purify_touch", cost: 9, requires: ["iron_reserve"], tier: 1, column: 0 },
  { perkId: "hex_ward", cost: 10, requires: ["lucky_streak"], tier: 1, column: 1 },
  { perkId: "ghost_repel", cost: 11, requires: ["final_guard"], tier: 1, column: 2 },
  { perkId: "money_stream", cost: 9, requires: ["lucky_money"], tier: 1, column: 3 },
  { perkId: "percent_focus", cost: 9, requires: ["lucky_percent"], tier: 1, column: 4 },
  { perkId: "cycle_momentum", cost: 14, requires: ["ante_insurance"], tier: 2, column: 7 },
  { perkId: "curse_break", cost: 24, requires: ["purify_touch", "hex_ward"], tier: 3, column: 4 },
];

export const RUN_LOOP = {
  wheelsPerFloor: WHEEL_COUNT,
  infiniteFloors: true,
  /** Pulse shop button after each wheel — player opens shop manually. */
  shopHighlightAfterEachWheel: true,
} as const;
