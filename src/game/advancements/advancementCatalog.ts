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

/** Run upgrades — separate from jokers; bought with shop chips. */
export const ADVANCEMENT_CATALOG: Record<string, AdvancementDef> = {
  money_on_all: {
    id: "money_on_all",
    name: "Cash Line",
    line: "+1 cash wedge on every wheel except Money (7+ slices)",
    cost: 14,
    tier: 1,
    kind: "inject_money",
    icon: "attach-money",
    skipWheel: "wheel_1",
    injectPrize: "money_80",
  },
  perk_on_all: {
    id: "perk_on_all",
    name: "Perk Line",
    line: "+1 perk wedge on every wheel except Perk (7+ slices)",
    cost: 16,
    tier: 1,
    kind: "inject_perk",
    icon: "auto-awesome",
    skipWheel: "wheel_4",
    injectPrize: "perk_lucky_streak",
  },
  percent_drip: {
    id: "percent_drip",
    name: "Percent Drip",
    line: "+1 +4% bank wedge on every wheel except Percent (7+ slices)",
    cost: 13,
    tier: 1,
    kind: "inject_percent",
    icon: "percent",
    skipWheel: "wheel_2",
    injectPrize: "bank_gain_4",
  },
  lucky_dip: {
    id: "lucky_dip",
    name: "Lucky Dip",
    line: "+8% land chance on all positive wedges",
    cost: 10,
    tier: 0,
    kind: "positive_weight",
    icon: "casino",
    value: 1.08,
  },
  cycle_stipend: {
    id: "cycle_stipend",
    name: "Cycle Pay",
    line: "+$75 bank at the start of each new cycle",
    cost: 12,
    tier: 0,
    kind: "cycle_stipend",
    icon: "payments",
    value: 75,
  },
  interest_boost: {
    id: "interest_boost",
    name: "Interest ×2",
    line: "Double end-of-cycle interest on your bank",
    cost: 11,
    tier: 0,
    kind: "interest_mult",
    icon: "savings",
    value: 2,
  },
  shop_extra: {
    id: "shop_extra",
    name: "Wide Shop",
    line: "+1 extra joker and advancement offer per shop visit",
    cost: 15,
    tier: 2,
    kind: "extra_shop_offers",
    icon: "storefront",
    value: 1,
  },
  pool_scout: {
    id: "pool_scout",
    name: "Pool Scout",
    line: "Random wheels unlock nastier prizes 1 cycle earlier",
    cost: 18,
    tier: 2,
    kind: "pool_early",
    icon: "explore",
    value: 1,
  },
  soft_landing: {
    id: "soft_landing",
    name: "Soft Landing",
    line: "First cash loss each cycle is halved",
    cost: 14,
    tier: 1,
    kind: "soft_landing",
    icon: "airline-seat-flat",
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
