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
  green_fever: def("green_fever", "Green Fever", "leaf", "MaterialCommunityIcons", 0, "wheel", "odds"),
  chip_drip: def("chip_drip", "Chip Drip", "water", "MaterialCommunityIcons", 0, "meta", "shop"),
  deep_pockets: def("deep_pockets", "Deep Pockets", "wallet", "MaterialCommunityIcons", 1, "meta", "shop"),
  drain_ward: def("drain_ward", "Drain Ward", "shield-half-full", "MaterialCommunityIcons", 1, "defense", "defense"),
  lucky_percent: def("lucky_percent", "Lucky Percent", "percent", "MaterialIcons", 0, "wheel", "odds"),
  chaos_ward: def("chaos_ward", "Chaos Ward", "shield-alert", "MaterialCommunityIcons", 1, "defense", "defense"),
  streak_spark: def("streak_spark", "Streak Spark", "lightning-bolt", "MaterialCommunityIcons", 2, "meta", "shop"),
  jackpot_hunter: def(
    "jackpot_hunter",
    "Jackpot Hunter",
    "treasure-chest",
    "MaterialCommunityIcons",
    2,
    "wheel",
    "odds"
  ),
  purify_touch: def(
    "purify_touch",
    "Purify Touch",
    "water-outline",
    "MaterialCommunityIcons",
    1,
    "defense",
    "defense"
  ),
  hex_ward: def("hex_ward", "Hex Ward", "hexagon", "MaterialCommunityIcons", 1, "defense", "defense"),
  ghost_repel: def(
    "ghost_repel",
    "Ghost Repel",
    "ghost-off",
    "MaterialCommunityIcons",
    1,
    "defense",
    "defense"
  ),
  money_stream: def(
    "money_stream",
    "Money Stream",
    "cash-fast",
    "MaterialCommunityIcons",
    1,
    "wheel",
    "odds"
  ),
  percent_focus: def("percent_focus", "Percent Focus", "percent", "MaterialIcons", 1, "wheel", "odds"),
  curse_break: def(
    "curse_break",
    "Curse Break",
    "broom",
    "MaterialCommunityIcons",
    3,
    "defense",
    "defense"
  ),
  cycle_momentum: def(
    "cycle_momentum",
    "Cycle Momentum",
    "chart-line",
    "MaterialCommunityIcons",
    2,
    "meta",
    "shop"
  ),
};

export const SLICE_PERK_IDS = ["extra_slice", "slice_expander"] as const;

export const PERK_CATALOG = withRegistryIcons(PERK_CATALOG_RAW, "perk");

export const PERK_IDS = Object.keys(PERK_CATALOG);
