import type { PerkCategory } from "../../data/perks";
import { getPerkEffect } from "../effects/perkEffects";

function perkLine(perkId: string): string {
  return getPerkEffect(perkId)?.line ?? "";
}

/** Player-facing category labels (not internal enum names). */
export const PERK_CATEGORY_LABELS: Record<PerkCategory, string> = {
  economy: "Money",
  defense: "Defense",
  wheel: "Wheel",
  meta: "Shop & cycles",
};

export const PERK_CATEGORY_COLORS: Record<PerkCategory, { bg: string; accent: string }> = {
  economy: { bg: "#FEF9C3", accent: "#A16207" },
  defense: { bg: "#DBEAFE", accent: "#1D4ED8" },
  wheel: { bg: "#EDE9FE", accent: "#6D28D9" },
  meta: { bg: "#CFFAFE", accent: "#0E7490" },
};

export type PerkDisplayCopy = {
  tagline: string;
  shopLine: string;
  bullets: string[];
};

/** Short lines for shop + detail — one primary effect line. */
export function getPerkDetailLines(perkId: string): string[] {
  const line = perkLine(perkId);
  return line.length > 0 ? [line] : [];
}

export const PERK_DISPLAY: Record<string, PerkDisplayCopy> = {
  lucky_money: {
    tagline: "W1 luck",
    shopLine: perkLine("lucky_money"),
    bullets: [],
  },
  lucky_perk: {
    tagline: "W4 luck",
    shopLine: perkLine("lucky_perk"),
    bullets: [],
  },
  lucky_streak: {
    tagline: "Lucky runs",
    shopLine: perkLine("lucky_streak"),
    bullets: [],
  },
  lucky_percent: {
    tagline: "W2 luck",
    shopLine: perkLine("lucky_percent"),
    bullets: [],
  },
  iron_reserve: {
    tagline: "Block 1 hit",
    shopLine: perkLine("iron_reserve"),
    bullets: [],
  },
  ante_insurance: {
    tagline: "Cycle chips",
    shopLine: perkLine("ante_insurance"),
    bullets: [],
  },
  high_roller: {
    tagline: "W1 boost",
    shopLine: perkLine("high_roller"),
    bullets: [],
  },
  gold_rush: {
    tagline: "Cash boost",
    shopLine: perkLine("gold_rush"),
    bullets: [],
  },
  safe_harbor: {
    tagline: "Softer hits",
    shopLine: perkLine("safe_harbor"),
    bullets: [],
  },
  coupon_king: {
    tagline: "Shop sale",
    shopLine: perkLine("coupon_king"),
    bullets: [],
  },
  hot_table: {
    tagline: "Rare hunt",
    shopLine: perkLine("hot_table"),
    bullets: [],
  },
  vip_roller: {
    tagline: "% boost",
    shopLine: perkLine("vip_roller"),
    bullets: [],
  },
  double_down: {
    tagline: "One double",
    shopLine: perkLine("double_down"),
    bullets: [],
  },
  compounder: {
    tagline: "Scale up",
    shopLine: perkLine("compounder"),
    bullets: [],
  },
  final_guard: {
    tagline: "Final armor",
    shopLine: perkLine("final_guard"),
    bullets: [],
  },
  final_tax_shield: {
    tagline: "Tax cap",
    shopLine: perkLine("final_tax_shield"),
    bullets: [],
  },
  clutch_cash: {
    tagline: "Final payday",
    shopLine: perkLine("clutch_cash"),
    bullets: [],
  },
  green_fever: {
    tagline: "Green bias",
    shopLine: perkLine("green_fever"),
    bullets: [],
  },
  chip_drip: {
    tagline: "Chip drip",
    shopLine: perkLine("chip_drip"),
    bullets: [],
  },
  deep_pockets: {
    tagline: "Deep run",
    shopLine: perkLine("deep_pockets"),
    bullets: [],
  },
  drain_ward: {
    tagline: "Drain ward",
    shopLine: perkLine("drain_ward"),
    bullets: [],
  },
  chaos_ward: {
    tagline: "Chaos guard",
    shopLine: perkLine("chaos_ward"),
    bullets: [],
  },
  streak_spark: {
    tagline: "Hot streak",
    shopLine: perkLine("streak_spark"),
    bullets: [],
  },
  jackpot_hunter: {
    tagline: "W6 hunt",
    shopLine: perkLine("jackpot_hunter"),
    bullets: [],
  },
  purify_touch: {
    tagline: "Cleanse",
    shopLine: perkLine("purify_touch"),
    bullets: [],
  },
  hex_ward: {
    tagline: "Curse resist",
    shopLine: perkLine("hex_ward"),
    bullets: [],
  },
  ghost_repel: {
    tagline: "Boss Ghost",
    shopLine: perkLine("ghost_repel"),
    bullets: [],
  },
  money_stream: {
    tagline: "W1 stream",
    shopLine: perkLine("money_stream"),
    bullets: [],
  },
  percent_focus: {
    tagline: "W2 focus",
    shopLine: perkLine("percent_focus"),
    bullets: [],
  },
  curse_break: {
    tagline: "Full cleanse",
    shopLine: perkLine("curse_break"),
    bullets: [],
  },
  cycle_momentum: {
    tagline: "Long run",
    shopLine: perkLine("cycle_momentum"),
    bullets: [],
  },
  rush_hour: { tagline: "W1 rush", shopLine: perkLine("rush_hour"), bullets: [] },
  perk_magnet: { tagline: "W4 pull", shopLine: perkLine("perk_magnet"), bullets: [] },
  green_chain: { tagline: "Green link", shopLine: perkLine("green_chain"), bullets: [] },
  bank_bloom: { tagline: "Cash bloom", shopLine: perkLine("bank_bloom"), bullets: [] },
  chip_hoarder: { tagline: "Cycle chips", shopLine: perkLine("chip_hoarder"), bullets: [] },
  tax_cut: { tagline: "Tax relief", shopLine: perkLine("tax_cut"), bullets: [] },
  bleed_slow: { tagline: "Soft hits", shopLine: perkLine("bleed_slow"), bullets: [] },
  cycle_tithe: { tagline: "Cycle drip", shopLine: perkLine("cycle_tithe"), bullets: [] },
};

export function getPerkDisplay(perkId: string): PerkDisplayCopy | null {
  return PERK_DISPLAY[perkId] ?? null;
}

export function perkPrizeLabel(perkId: string): string {
  const names: Record<string, string> = {
    lucky_money: "Lucky Money",
    lucky_perk: "Lucky Perk",
    lucky_streak: "Lucky Charm",
    gold_rush: "Gold Rush",
    iron_reserve: "Iron Shield",
    safe_harbor: "Safe Harbor",
    high_roller: "Loaded Money",
    hot_table: "Hot Table",
    vip_roller: "Percent Plus",
    double_down: "Double Down",
    ante_insurance: "Cycle Cushion",
    compounder: "Compounder",
    coupon_king: "Coupon King",
    final_guard: "Final Guard",
    final_tax_shield: "Tax Shield",
    clutch_cash: "Clutch Cash",
    green_fever: "Green Fever",
    chip_drip: "Chip Drip",
    deep_pockets: "Deep Pockets",
    drain_ward: "Drain Ward",
    lucky_percent: "Lucky Percent",
    chaos_ward: "Chaos Ward",
    streak_spark: "Streak Spark",
    jackpot_hunter: "Jackpot Hunter",
    purify_touch: "Purify Touch",
    hex_ward: "Hex Ward",
    ghost_repel: "Ghost Repel",
    money_stream: "Money Stream",
    percent_focus: "Percent Focus",
    curse_break: "Curse Break",
    cycle_momentum: "Cycle Momentum",
    rush_hour: "Rush Hour",
    perk_magnet: "Perk Magnet",
    green_chain: "Green Chain",
    bank_bloom: "Bank Bloom",
    chip_hoarder: "Chip Hoarder",
    tax_cut: "Tax Cut",
    bleed_slow: "Bleed Slow",
    cycle_tithe: "Cycle Tithe",
  };
  return names[perkId] ?? perkId;
}
