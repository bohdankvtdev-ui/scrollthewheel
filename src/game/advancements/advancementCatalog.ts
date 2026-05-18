import type { WheelConfigId } from "../wheels/database/types";
import type { PrizeCatalogId } from "../wheels/database/prizeCatalog";

export type AdvancementKind =
  | "inject_money"
  | "inject_perk"
  | "inject_percent"
  | "positive_weight"
  | "cycle_stipend"
  | "interest_mult"
  | "extra_shop_offers"
  | "pool_early"
  | "soft_landing";

export type AdvancementDef = {
  id: string;
  name: string;
  line: string;
  cost: number;
  tier: number;
  kind: AdvancementKind;
  icon: string;
  /** Do not inject on this wheel (already themed). */
  skipWheel?: WheelConfigId;
  injectPrize?: PrizeCatalogId;
  value?: number;
};

/** Run upgrades — separate from perks; bought with shop chips. */
export const ADVANCEMENT_CATALOG: Record<string, AdvancementDef> = {
  money_on_all: {
    id: "money_on_all",
    name: "Extra Cash Slice",
    line: "+1 +$ wedge on wheels 2–9",
    cost: 14,
    tier: 1,
    kind: "inject_money",
    icon: "add-circle-outline",
    skipWheel: "wheel_1",
    injectPrize: "money_80",
  },
  perk_on_all: {
    id: "perk_on_all",
    name: "Extra Perk Slice",
    line: "+1 perk wedge on wheels 1–3, 5–9",
    cost: 16,
    tier: 1,
    kind: "inject_perk",
    icon: "star-outline",
    skipWheel: "wheel_4",
    injectPrize: "perk_lucky_streak",
  },
  percent_drip: {
    id: "percent_drip",
    name: "Extra % Slice",
    line: "+1 +4% bank wedge on wheels 1, 3–9",
    cost: 13,
    tier: 1,
    kind: "inject_percent",
    icon: "trending-up",
    skipWheel: "wheel_2",
    injectPrize: "bank_gain_4",
  },
  lucky_dip: {
    id: "lucky_dip",
    name: "Better Odds",
    line: "+8% chance to land green wedges",
    cost: 10,
    tier: 0,
    kind: "positive_weight",
    icon: "thumb-up",
    value: 1.08,
  },
  cycle_stipend: {
    id: "cycle_stipend",
    name: "Cycle Bonus $",
    line: "+$75 bank when a new cycle starts",
    cost: 12,
    tier: 0,
    kind: "cycle_stipend",
    icon: "account-balance-wallet",
    value: 75,
  },
  interest_boost: {
    id: "interest_boost",
    name: "Double Interest",
    line: "2× cash interest at end of each cycle",
    cost: 11,
    tier: 0,
    kind: "interest_mult",
    icon: "savings",
    value: 2,
  },
  shop_extra: {
    id: "shop_extra",
    name: "Bigger Shop",
    line: "+1 perk & upgrade card each shop visit",
    cost: 15,
    tier: 2,
    kind: "extra_shop_offers",
    icon: "store",
    value: 1,
  },
  pool_scout: {
    id: "pool_scout",
    name: "Early Unlocks",
    line: "Hard slices appear 1 cycle sooner (risk + reward)",
    cost: 18,
    tier: 2,
    kind: "pool_early",
    icon: "lock-open",
    value: 1,
  },
  soft_landing: {
    id: "soft_landing",
    name: "First Hit Half",
    line: "First −$ loss each cycle deals half damage",
    cost: 14,
    tier: 1,
    kind: "soft_landing",
    icon: "shield",
    value: 0.5,
  },
};

export const SHOP_ADVANCEMENT_POOL = Object.keys(ADVANCEMENT_CATALOG);

export function getAdvancementDef(id: string): AdvancementDef | undefined {
  return ADVANCEMENT_CATALOG[id];
}

export function hasAdvancement(run: { advancements?: string[] }, id: string): boolean {
  return (run.advancements ?? []).includes(id);
}
