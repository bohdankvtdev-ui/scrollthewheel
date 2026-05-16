/**
 * ICON REGISTRY — edit icons here to change them everywhere in the app.
 *
 * Keys:
 * - `perk`, `card`, `debuff`, `relic` — match entity `id` in data/*.ts catalogs
 * - `slice` — optional per-slice override (slice `id` from prizes.ts pools)
 * - `sliceKind` — fallback when no slice override and no linked entity icon
 * - `wheelRole` — floor/wheel background stage icons (loop.ts WHEEL_STAGES)
 *
 * `icon` must exist in the chosen `iconFamily` glyph map (Expo vector icons).
 * Later: swap to `{ asset: require("...") }` when you add custom PNG/SVG assets.
 */
import type { IconFamily, SliceKind, WheelRole } from "../../schemas";

export type IconSpec = {
  icon: string;
  iconFamily: IconFamily;
  /** Optional tint for PrizeGlyph / loadout chips */
  tint?: string;
};

export const ICON_REGISTRY = {
  perk: {
    lucky_streak: { icon: "stars", iconFamily: "MaterialIcons" },
    iron_reserve: { icon: "shield", iconFamily: "MaterialCommunityIcons" },
    ante_insurance: { icon: "policy", iconFamily: "MaterialIcons" },
    extra_slice: { icon: "unfold-more", iconFamily: "MaterialIcons" },
    slice_expander: { icon: "unfold-more", iconFamily: "MaterialIcons" },
    high_roller: { icon: "casino", iconFamily: "MaterialIcons" },
    gold_rush: { icon: "trending-up", iconFamily: "MaterialIcons" },
    safe_harbor: { icon: "security", iconFamily: "MaterialIcons" },
    coupon_king: { icon: "sell", iconFamily: "MaterialIcons" },
    hot_table: { icon: "whatshot", iconFamily: "MaterialIcons" },
    vip_roller: { icon: "workspace-premium", iconFamily: "MaterialIcons" },
    double_down: { icon: "exposure-plus-1", iconFamily: "MaterialIcons" },
    compounder: { icon: "savings", iconFamily: "MaterialIcons" },
  },
  card: {
    copper_chip: { icon: "paid", iconFamily: "MaterialIcons" },
    weighted_die: { icon: "casino", iconFamily: "MaterialIcons" },
    purity_charm: { icon: "security", iconFamily: "MaterialIcons" },
    wide_wheel_card: { icon: "unfold-more", iconFamily: "MaterialIcons" },
  },
  debuff: {
    debt_mark: { icon: "skull", iconFamily: "MaterialCommunityIcons" },
    rusted_gear: { icon: "alert-octagon", iconFamily: "MaterialCommunityIcons" },
    curse_of_greed: { icon: "whatshot", iconFamily: "MaterialIcons" },
  },
  relic: {
    lucky_coin: { icon: "monetization-on", iconFamily: "MaterialIcons" },
    void_lens: { icon: "diamond", iconFamily: "MaterialIcons" },
    boss_slayer: { icon: "sword-cross", iconFamily: "MaterialCommunityIcons" },
  },
  wheelRole: {
    base: { icon: "casino", iconFamily: "MaterialIcons" },
    yield: { icon: "attach-money", iconFamily: "MaterialIcons" },
    risk: { icon: "bolt", iconFamily: "MaterialIcons" },
    stabilizer: { icon: "healing", iconFamily: "MaterialIcons" },
    mini_boss: { icon: "local-fire-department", iconFamily: "MaterialIcons" },
    jackpot: { icon: "emoji-events", iconFamily: "MaterialIcons" },
    power: { icon: "auto-awesome", iconFamily: "MaterialIcons" },
    deck: { icon: "style", iconFamily: "MaterialIcons" },
    preparation: { icon: "stars", iconFamily: "MaterialIcons" },
    boss: { icon: "donut-large", iconFamily: "MaterialIcons" },
  },
  /** Override a specific wheel slice by id (see prizes.ts). */
  slice: {} as Record<string, IconSpec>,
  sliceKind: {
    money: { icon: "attach-money", iconFamily: "MaterialIcons" },
    money_loss: { icon: "remove-circle", iconFamily: "MaterialIcons" },
    perk: { icon: "auto-awesome", iconFamily: "MaterialIcons" },
    debuff: { icon: "warning", iconFamily: "MaterialIcons" },
    deck_add: { icon: "style", iconFamily: "MaterialIcons" },
    deck_remove: { icon: "delete", iconFamily: "MaterialIcons" },
    deck_upgrade: { icon: "upgrade", iconFamily: "MaterialCommunityIcons" },
    relic_offer: { icon: "diamond", iconFamily: "MaterialIcons" },
    booster: { icon: "trending-up", iconFamily: "MaterialIcons" },
    neutral: { icon: "remove", iconFamily: "MaterialIcons" },
    bank_wipe: { icon: "dangerous", iconFamily: "MaterialIcons" },
    bank_cut: { icon: "percent", iconFamily: "MaterialIcons" },
  } satisfies Record<SliceKind, IconSpec>,
} as const;

export type IconEntityType = keyof typeof ICON_REGISTRY;

export function getRegistryIcon(
  type: IconEntityType,
  id: string
): IconSpec | undefined {
  const bucket = ICON_REGISTRY[type] as Record<string, IconSpec>;
  return bucket[id];
}

export function getWheelRoleIcon(role: WheelRole): IconSpec {
  return ICON_REGISTRY.wheelRole[role] ?? ICON_REGISTRY.wheelRole.base;
}
