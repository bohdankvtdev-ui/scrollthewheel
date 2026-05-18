import type { IconFamily } from "../schemas";
import type { PerkTier } from "../game/gdd";
import { PERK_DISPLAY } from "../game/perks/perkDisplay";
import type { PerkFamily } from "../game/perks/perkFamilies";
import { withRegistryIcons } from "../game/content/withRegistryIcons";

export type PerkCategory = "economy" | "defense" | "wheel" | "meta";

export type PerkDefinition = {
  id: string;
  name: string;
  icon: string;
  iconFamily: IconFamily;
  description: string;
  tagline: string;
  tier: PerkTier;
  category: PerkCategory;
  family: PerkFamily;
};

function def(
  id: string,
  name: string,
  icon: string,
  iconFamily: IconFamily,
  tier: PerkTier,
  category: PerkCategory,
  family: PerkFamily
): PerkDefinition {
  const copy = PERK_DISPLAY[id];
  return {
    id,
    name,
    icon,
    iconFamily,
    tier,
    category,
    family,
    tagline: copy?.tagline ?? "",
    description: copy?.shopLine ?? "",
  };
}

const PERK_CATALOG_RAW: Record<string, PerkDefinition> = {
  lucky_money: def("lucky_money", "Lucky Money", "cash", "MaterialCommunityIcons", 0, "wheel", "odds"),
  lucky_perk: def("lucky_perk", "Lucky Perk", "star-four-points", "MaterialCommunityIcons", 0, "wheel", "odds"),
  lucky_streak: def("lucky_streak", "Lucky Charm", "clover", "MaterialCommunityIcons", 0, "wheel", "odds"),
  iron_reserve: def("iron_reserve", "Iron Shield", "shield-check", "MaterialCommunityIcons", 0, "defense", "defense"),
  ante_insurance: def("ante_insurance", "Cycle Cushion", "umbrella", "MaterialCommunityIcons", 0, "meta", "shop"),
  high_roller: def("high_roller", "Loaded Money", "dice-multiple", "MaterialCommunityIcons", 1, "wheel", "odds"),
  gold_rush: def("gold_rush", "Gold Rush", "cash-multiple", "MaterialCommunityIcons", 1, "economy", "bank"),
  safe_harbor: def("safe_harbor", "Safe Harbor", "anchor", "MaterialCommunityIcons", 1, "defense", "defense"),
  coupon_king: def("coupon_king", "Coupon King", "ticket-percent", "MaterialCommunityIcons", 2, "meta", "shop"),
  hot_table: def("hot_table", "Hot Table", "fire", "MaterialCommunityIcons", 2, "economy", "bank"),
  vip_roller: def("vip_roller", "Percent Plus", "crown", "MaterialCommunityIcons", 2, "wheel", "odds"),
  double_down: def("double_down", "Double Down", "cards-playing", "MaterialCommunityIcons", 2, "economy", "bank"),
  compounder: def("compounder", "Compounder", "chart-timeline-variant", "MaterialCommunityIcons", 3, "economy", "bank"),
  final_guard: def("final_guard", "Final Guard", "shield-sword", "MaterialCommunityIcons", 1, "defense", "final"),
  final_tax_shield: def(
    "final_tax_shield",
    "Tax Shield",
    "shield-account",
    "MaterialCommunityIcons",
    2,
    "defense",
    "final"
  ),
  clutch_cash: def("clutch_cash", "Clutch Cash", "cash-fast", "MaterialCommunityIcons", 1, "economy", "final"),
};

export const SLICE_PERK_IDS = ["extra_slice", "slice_expander"] as const;

export const PERK_CATALOG = withRegistryIcons(PERK_CATALOG_RAW, "perk");

export const PERK_IDS = Object.keys(PERK_CATALOG);
