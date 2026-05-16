/**
 * Game loop database — wheels rotation, economy, infinite scaling, shop tree.
 */
import type { IconFamily, InfiniteScalingParams, SliceCount, WheelDefinition, WheelRole } from "../schemas";
import { getBlindQuota } from "./gdd";
import { FLOOR_WHEEL_COUNT, prototypeToWheelDefinitions } from "./wheels";

export { GDD_PACING, GDD_LOOP_SUMMARY, PRIZE_TAXONOMY, getBlindQuota, getWheelDifficultyBias } from "./gdd";

export const RUN_DEFAULTS = {
  startingMoney: 0,
  startingFloor: 1,
  startingSliceCapacity: 6 as SliceCount,
  maxSliceCapacity: 8 as SliceCount,
  minSliceCapacity: 6 as SliceCount,
  historyMaxEvents: 50,
  /** Run ends only when bank goes negative (Balatro allows $0). */
  bankruptcyThreshold: -1,
} as const;

export const INFINITE_SCALING = {
  negativeWeightStep: 0.12,
  stakesMultStep: 0.1,
  moneyInflationStep: 0.08,
  /** Extra negative bias per wheel index within a floor (0–8) */
  wheelIndexNegativeStep: 0.035,
  sliceCapacityBonusFromFloor: 4,
  sliceCapacityBonus: 0,
} as const;

/** Ante labels — Balatro-style escalation. */
export function getBlindLabel(floor: number): string {
  const f = Math.max(1, floor);
  return `Ante ${f}`;
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

/** 10-wheel floor prototype (see `game/wheels/floorPrototype.ts`). */
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
  base: { role: "base", label: "W1", vibe: "Opening spin", icon: "casino", iconFamily: "MaterialIcons", accent: "#FFE94D", pageTint: "#1a1428" },
  yield: { role: "yield", label: "W2", vibe: "Cash wheel", icon: "attach-money", iconFamily: "MaterialIcons", accent: "#4ADE80", pageTint: "#121f18" },
  risk: { role: "risk", label: "W3", vibe: "Risk wheel", icon: "bolt", iconFamily: "MaterialIcons", accent: "#FF6B9D", pageTint: "#22121c" },
  stabilizer: { role: "stabilizer", label: "W4", vibe: "Cooldown", icon: "healing", iconFamily: "MaterialIcons", accent: "#22D3EE", pageTint: "#101820" },
  mini_boss: { role: "mini_boss", label: "W5", vibe: "Stakes wheel", icon: "local-fire-department", iconFamily: "MaterialIcons", accent: "#FF2D55", pageTint: "#241018" },
  jackpot: { role: "jackpot", label: "W6", vibe: "Jackpot wheel", icon: "emoji-events", iconFamily: "MaterialIcons", accent: "#FACC15", pageTint: "#221c08" },
  power: { role: "power", label: "W7", vibe: "Perk wheel", icon: "auto-awesome", iconFamily: "MaterialIcons", accent: "#C4B5FD", pageTint: "#1a1228" },
  deck: { role: "deck", label: "W8", vibe: "Mod wheel", icon: "style", iconFamily: "MaterialIcons", accent: "#22D3EE", pageTint: "#121a22" },
  preparation: { role: "preparation", label: "Prep", vibe: "Power up", icon: "stars", iconFamily: "MaterialIcons", accent: "#C4B5FD", pageTint: "#18122a" },
  boss: { role: "boss", label: "W9", vibe: "Boss wheel", icon: "donut-large", iconFamily: "MaterialIcons", accent: "#FF2D55", pageTint: "#1c0810" },
};

export type ShopPerkNode = {
  perkId: string;
  cost: number;
  requires: string[];
  tier: number;
  column: number;
};

export const SHOP_PERK_TREE: ShopPerkNode[] = [
  { perkId: "lucky_streak", cost: 4, requires: [], tier: 0, column: 0 },
  { perkId: "iron_reserve", cost: 5, requires: [], tier: 0, column: 1 },
  { perkId: "ante_insurance", cost: 3, requires: [], tier: 0, column: 2 },
  { perkId: "extra_slice", cost: 6, requires: [], tier: 0, column: 3 },
  { perkId: "high_roller", cost: 8, requires: ["lucky_streak"], tier: 1, column: 0 },
  { perkId: "gold_rush", cost: 10, requires: ["lucky_streak"], tier: 1, column: 1 },
  { perkId: "safe_harbor", cost: 9, requires: ["iron_reserve"], tier: 1, column: 2 },
  { perkId: "slice_expander", cost: 12, requires: ["extra_slice"], tier: 1, column: 3 },
  { perkId: "hot_table", cost: 14, requires: ["gold_rush"], tier: 2, column: 0 },
  { perkId: "coupon_king", cost: 15, requires: ["high_roller"], tier: 2, column: 1 },
  { perkId: "vip_roller", cost: 16, requires: ["high_roller"], tier: 2, column: 2 },
  { perkId: "double_down", cost: 18, requires: ["gold_rush", "iron_reserve"], tier: 2, column: 3 },
  { perkId: "compounder", cost: 22, requires: ["hot_table", "coupon_king"], tier: 3, column: 1 },
];

export function getBlindQuotaForRun(floor: number, perkIds: string[]): number {
  return getBlindQuota(floor, perkIds);
}

export const RUN_LOOP = {
  wheelsPerFloor: WHEEL_COUNT,
  infiniteFloors: true,
  /** Pulse shop button after each wheel — player opens shop manually. */
  shopHighlightAfterEachWheel: true,
} as const;
