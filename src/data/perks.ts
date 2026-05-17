import type { IconFamily } from "../schemas";
import type { PerkTier } from "../game/gdd";
import { PERK_DISPLAY } from "../game/perks/perkDisplay";
import { withRegistryIcons } from "../game/content/withRegistryIcons";

export type PerkCategory = "economy" | "defense" | "wheel" | "meta";

export type PerkDefinition = {
  id: string;
  name: string;
  icon: string;
  iconFamily: IconFamily;
  /** Short line for shop cards & tooltips */
  description: string;
  tagline: string;
  tier: PerkTier;
  category: PerkCategory;
};

function def(
  id: string,
  name: string,
  icon: string,
  iconFamily: IconFamily,
  tier: PerkTier,
  category: PerkCategory
): PerkDefinition {
  const copy = PERK_DISPLAY[id];
  return {
    id,
    name,
    icon,
    iconFamily,
    tier,
    category,
    tagline: copy?.tagline ?? "",
    description: copy?.shopLine ?? "",
  };
}

const PERK_CATALOG_RAW: Record<string, PerkDefinition> = {
  lucky_money: def(
    "lucky_money",
    "Lucky Money",
    "cash",
    "MaterialCommunityIcons",
    0,
    "wheel"
  ),
  lucky_perk: def(
    "lucky_perk",
    "Lucky Perk",
    "star-four-points",
    "MaterialCommunityIcons",
    0,
    "wheel"
  ),
  lucky_streak: def(
    "lucky_streak",
    "Lucky Charm",
    "clover",
    "MaterialCommunityIcons",
    0,
    "wheel"
  ),
  iron_reserve: def(
    "iron_reserve",
    "Iron Shield",
    "shield-check",
    "MaterialCommunityIcons",
    0,
    "defense"
  ),
  ante_insurance: def(
    "ante_insurance",
    "Cycle Cushion",
    "umbrella",
    "MaterialCommunityIcons",
    0,
    "meta"
  ),
  high_roller: def(
    "high_roller",
    "Loaded Money",
    "dice-multiple",
    "MaterialCommunityIcons",
    1,
    "wheel"
  ),
  gold_rush: def(
    "gold_rush",
    "Gold Rush",
    "cash-multiple",
    "MaterialCommunityIcons",
    1,
    "economy"
  ),
  safe_harbor: def(
    "safe_harbor",
    "Safe Harbor",
    "anchor",
    "MaterialCommunityIcons",
    1,
    "defense"
  ),
  coupon_king: def(
    "coupon_king",
    "Coupon King",
    "ticket-percent",
    "MaterialCommunityIcons",
    2,
    "meta"
  ),
  hot_table: def(
    "hot_table",
    "Hot Table",
    "fire",
    "MaterialCommunityIcons",
    2,
    "economy"
  ),
  vip_roller: def(
    "vip_roller",
    "Percent Plus",
    "crown",
    "MaterialCommunityIcons",
    2,
    "wheel"
  ),
  double_down: def(
    "double_down",
    "Double Down",
    "cards-playing",
    "MaterialCommunityIcons",
    2,
    "economy"
  ),
  compounder: def(
    "compounder",
    "Compounder",
    "chart-timeline-variant",
    "MaterialCommunityIcons",
    3,
    "economy"
  ),
};

/** @deprecated Wheels are fixed at 6 slices — not sold or shown. */
export const SLICE_PERK_IDS = ["extra_slice", "slice_expander"] as const;

export const PERK_CATALOG = withRegistryIcons(PERK_CATALOG_RAW, "perk");

export const PERK_IDS = Object.keys(PERK_CATALOG);
