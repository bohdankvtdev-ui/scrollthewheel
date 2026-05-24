/**
 * ICON REGISTRY — edit icons here to change them everywhere in the app.
 */
import type { IconFamily, SliceKind, WheelRole } from "../../schemas";

export type IconSpec = {
  icon: string;
  iconFamily: IconFamily;
  tint?: string;
};

export const ICON_REGISTRY = {
  perk: {
    lucky_streak: { icon: "clover", iconFamily: "MaterialCommunityIcons" },
    iron_reserve: { icon: "shield-check", iconFamily: "MaterialCommunityIcons" },
    ante_insurance: { icon: "umbrella", iconFamily: "MaterialCommunityIcons" },
    high_roller: { icon: "cash-plus", iconFamily: "MaterialCommunityIcons" },
    gold_rush: { icon: "cash-multiple", iconFamily: "MaterialCommunityIcons" },
    safe_harbor: { icon: "anchor", iconFamily: "MaterialCommunityIcons" },
    coupon_king: { icon: "ticket-percent", iconFamily: "MaterialCommunityIcons" },
    hot_table: { icon: "fire", iconFamily: "MaterialCommunityIcons" },
    vip_roller: { icon: "crown", iconFamily: "MaterialCommunityIcons" },
    double_down: { icon: "repeat-once", iconFamily: "MaterialCommunityIcons" },
    compounder: { icon: "chart-timeline-variant", iconFamily: "MaterialCommunityIcons" },
    lucky_money: { icon: "cash", iconFamily: "MaterialCommunityIcons" },
    lucky_perk: { icon: "star-four-points", iconFamily: "MaterialCommunityIcons" },
    final_guard: { icon: "shield-sword", iconFamily: "MaterialCommunityIcons" },
    final_tax_shield: { icon: "shield-account", iconFamily: "MaterialCommunityIcons" },
    clutch_cash: { icon: "cash-fast", iconFamily: "MaterialCommunityIcons" },
    green_fever: { icon: "leaf", iconFamily: "MaterialCommunityIcons" },
    chip_drip: { icon: "poker-chip", iconFamily: "MaterialCommunityIcons" },
    deep_pockets: { icon: "wallet", iconFamily: "MaterialCommunityIcons" },
    drain_ward: { icon: "shield-remove", iconFamily: "MaterialCommunityIcons" },
    lucky_percent: { icon: "percent", iconFamily: "MaterialIcons" },
    chaos_ward: { icon: "shield-alert", iconFamily: "MaterialCommunityIcons" },
    streak_spark: { icon: "lightning-bolt", iconFamily: "MaterialCommunityIcons" },
    jackpot_hunter: { icon: "slot-machine", iconFamily: "MaterialCommunityIcons" },
    purify_touch: { icon: "water-outline", iconFamily: "MaterialCommunityIcons" },
    hex_ward: { icon: "hexagon-slice-6", iconFamily: "MaterialCommunityIcons" },
    ghost_repel: { icon: "ghost-off", iconFamily: "MaterialCommunityIcons" },
    money_stream: { icon: "cash-register", iconFamily: "MaterialCommunityIcons" },
    percent_focus: { icon: "functions", iconFamily: "MaterialIcons" },
    curse_break: { icon: "delete-sweep", iconFamily: "MaterialCommunityIcons" },
    cycle_momentum: { icon: "chart-line", iconFamily: "MaterialCommunityIcons" },
    rush_hour: { icon: "clock-fast", iconFamily: "MaterialCommunityIcons" },
    perk_magnet: { icon: "magnet", iconFamily: "MaterialCommunityIcons" },
    green_chain: { icon: "link-variant", iconFamily: "MaterialCommunityIcons" },
    bank_bloom: { icon: "flower", iconFamily: "MaterialCommunityIcons" },
    chip_hoarder: { icon: "treasure-chest", iconFamily: "MaterialCommunityIcons" },
    tax_cut: { icon: "scissors-cutting", iconFamily: "MaterialCommunityIcons" },
    bleed_slow: { icon: "bandage", iconFamily: "MaterialCommunityIcons" },
    cycle_tithe: { icon: "hand-coin", iconFamily: "MaterialCommunityIcons" },
  },
  card: {
    copper_chip: { icon: "poker-chip", iconFamily: "MaterialCommunityIcons" },
    weighted_die: { icon: "dice-5", iconFamily: "MaterialCommunityIcons" },
    purity_charm: { icon: "heart", iconFamily: "MaterialCommunityIcons" },
    wide_wheel_card: { icon: "chart-donut", iconFamily: "MaterialCommunityIcons" },
  },
  debuff: {
    debt_mark: { icon: "skull-crossbones", iconFamily: "MaterialCommunityIcons" },
    rusted_gear: { icon: "cog-off", iconFamily: "MaterialCommunityIcons" },
    curse_of_greed: { icon: "fire-alert", iconFamily: "MaterialCommunityIcons" },
  },
  relic: {
    lucky_coin: { icon: "circle-multiple", iconFamily: "MaterialCommunityIcons" },
    void_lens: { icon: "eye-off", iconFamily: "MaterialCommunityIcons" },
    boss_slayer: { icon: "sword-cross", iconFamily: "MaterialCommunityIcons" },
    coin_magnet: { icon: "magnet", iconFamily: "MaterialCommunityIcons" },
    firewall: { icon: "shield-lock", iconFamily: "MaterialCommunityIcons" },
    debt_shield: { icon: "shield-star", iconFamily: "MaterialCommunityIcons" },
    hot_hand: { icon: "hand-coin", iconFamily: "MaterialCommunityIcons" },
    iron_grit: { icon: "arm-flex", iconFamily: "MaterialCommunityIcons" },
  },
  wheelRole: {
    base: { icon: "casino", iconFamily: "MaterialIcons" },
    yield: { icon: "attach-money", iconFamily: "MaterialIcons" },
    risk: { icon: "bolt", iconFamily: "MaterialIcons" },
    stabilizer: { icon: "stars", iconFamily: "MaterialIcons" },
    mini_boss: { icon: "local-fire-department", iconFamily: "MaterialIcons" },
    jackpot: { icon: "emoji-events", iconFamily: "MaterialIcons" },
    power: { icon: "auto-awesome", iconFamily: "MaterialIcons" },
    deck: { icon: "build", iconFamily: "MaterialIcons" },
    preparation: { icon: "storefront", iconFamily: "MaterialIcons" },
    boss: { icon: "gavel", iconFamily: "MaterialIcons" },
  },
  slice: {} as Record<string, IconSpec>,
  sliceKind: {
    money: { icon: "attach-money", iconFamily: "MaterialIcons", tint: "#BBF7D0" },
    money_loss: { icon: "money-off", iconFamily: "MaterialIcons", tint: "#FECACA" },
    perk: { icon: "star-four-points", iconFamily: "MaterialCommunityIcons", tint: "#EDE9FE" },
    debuff: { icon: "skull-crossbones", iconFamily: "MaterialCommunityIcons", tint: "#FECACA" },
    deck_add: { icon: "poker-chip", iconFamily: "MaterialCommunityIcons", tint: "#CFFAFE" },
    deck_remove: { icon: "delete-outline", iconFamily: "MaterialIcons", tint: "#FED7AA" },
    deck_upgrade: { icon: "arrow-up-bold", iconFamily: "MaterialCommunityIcons", tint: "#D9F99D" },
    relic_offer: { icon: "diamond-stone", iconFamily: "MaterialCommunityIcons", tint: "#FEF08A" },
    booster: { icon: "trending-up", iconFamily: "MaterialIcons", tint: "#FEF9C3" },
    neutral: { icon: "minus", iconFamily: "MaterialIcons", tint: "#E5E7EB" },
    bank_wipe: { icon: "wallet-outline", iconFamily: "MaterialCommunityIcons", tint: "#FECACA" },
    bank_cut: { icon: "percent", iconFamily: "MaterialIcons", tint: "#FFEDD5" },
    run_effect: { icon: "flash-alert", iconFamily: "MaterialCommunityIcons", tint: "#FFEDD5" },
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
