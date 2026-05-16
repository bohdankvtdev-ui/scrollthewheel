import type { IconFamily } from "../schemas";
import type { PerkTier } from "../game/gdd";
import { withRegistryIcons } from "../game/content/withRegistryIcons";

export type PerkCategory = "economy" | "defense" | "wheel" | "meta";

export type PerkDefinition = {
  id: string;
  name: string;
  icon: string;
  iconFamily: IconFamily;
  description: string;
  tier: PerkTier;
  category: PerkCategory;
};

const PERK_CATALOG_RAW: Record<string, PerkDefinition> = {
  lucky_streak: {
    id: "lucky_streak",
    name: "Lucky Streak",
    icon: "stars",
    iconFamily: "MaterialIcons",
    description: "+15% odds on cash & perk slices",
    tier: 0,
    category: "economy",
  },
  iron_reserve: {
    id: "iron_reserve",
    name: "Iron Reserve",
    icon: "shield",
    iconFamily: "MaterialCommunityIcons",
    description: "+1 shield — blocks one cash loss",
    tier: 0,
    category: "defense",
  },
  ante_insurance: {
    id: "ante_insurance",
    name: "Quota Shield",
    icon: "policy",
    iconFamily: "MaterialIcons",
    description: "Floor cash target −12%",
    tier: 0,
    category: "meta",
  },
  extra_slice: {
    id: "extra_slice",
    name: "+1 Slice",
    icon: "unfold-more",
    iconFamily: "MaterialIcons",
    description: "+1 wedge next wheel (6→7→8 max)",
    tier: 0,
    category: "wheel",
  },
  slice_expander: {
    id: "slice_expander",
    name: "+1 Slice",
    icon: "unfold-more",
    iconFamily: "MaterialIcons",
    description: "Alias: +1 wedge",
    tier: 0,
    category: "wheel",
  },
  high_roller: {
    id: "high_roller",
    name: "High Roller",
    icon: "casino",
    iconFamily: "MaterialIcons",
    description: "+15% cash from money slices",
    tier: 1,
    category: "economy",
  },
  gold_rush: {
    id: "gold_rush",
    name: "Gold Rush",
    icon: "trending-up",
    iconFamily: "MaterialIcons",
    description: "+25% cash from money slices",
    tier: 1,
    category: "economy",
  },
  safe_harbor: {
    id: "safe_harbor",
    name: "Safe Harbor",
    icon: "security",
    iconFamily: "MaterialIcons",
    description: "+1 shield — stacks with Iron Reserve",
    tier: 1,
    category: "defense",
  },
  coupon_king: {
    id: "coupon_king",
    name: "Coupon King",
    icon: "sell",
    iconFamily: "MaterialIcons",
    description: "Shop prices −15%",
    tier: 2,
    category: "meta",
  },
  hot_table: {
    id: "hot_table",
    name: "Hot Table",
    icon: "whatshot",
    iconFamily: "MaterialIcons",
    description: "+10% rare & jackpot slice odds",
    tier: 2,
    category: "economy",
  },
  vip_roller: {
    id: "vip_roller",
    name: "VIP Roller",
    icon: "workspace-premium",
    iconFamily: "MaterialIcons",
    description: "+20% cash from money slices",
    tier: 2,
    category: "economy",
  },
  double_down: {
    id: "double_down",
    name: "Double Down",
    icon: "exposure-plus-1",
    iconFamily: "MaterialIcons",
    description: "Next cash slice pays ×2 (consumes)",
    tier: 2,
    category: "economy",
  },
  compounder: {
    id: "compounder",
    name: "Compounder",
    icon: "savings",
    iconFamily: "MaterialIcons",
    description: "+5% cash per floor already cleared",
    tier: 3,
    category: "economy",
  },
};

/** Icons overridden by `src/game/content/iconRegistry.ts` → `perk` table. */
export const PERK_CATALOG = withRegistryIcons(PERK_CATALOG_RAW, "perk");

export const PERK_IDS = Object.keys(PERK_CATALOG);
