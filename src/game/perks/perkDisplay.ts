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

/** Short lines for shop + detail — max 2 shown in UI. */
export function getPerkDetailLines(perkId: string): string[] {
  const d = PERK_DISPLAY[perkId];
  if (d == null) return [];
  const primary = d.shopLine.trim();
  const extra = d.bullets.find((b) => b.trim() !== primary);
  if (extra != null && extra.trim().length > 0) return [primary, extra.trim()];
  return primary.length > 0 ? [primary] : [];
}

export const PERK_DISPLAY: Record<string, PerkDisplayCopy> = {
  lucky_money: {
    tagline: "W1 luck",
    shopLine: "+12% +$ on Money wheel",
    bullets: ["Money wheel only"],
  },
  lucky_perk: {
    tagline: "W4 luck",
    shopLine: "+12% perks on Perk wheel",
    bullets: ["Perk wheel only"],
  },
  lucky_streak: {
    tagline: "Lucky runs",
    shopLine: "+8% green wedges",
    bullets: ["+2 chips on cash wins"],
  },
  lucky_percent: {
    tagline: "W2 luck",
    shopLine: "+10% +% on Percent wheel",
    bullets: ["Stacks VIP Roller"],
  },
  iron_reserve: {
    tagline: "Block 1 hit",
    shopLine: "+1 shield",
    bullets: ["Uses on next loss"],
  },
  ante_insurance: {
    tagline: "Cycle chips",
    shopLine: "+4 chips per cycle clear",
    bullets: ["Stacks each cycle"],
  },
  high_roller: {
    tagline: "W1 boost",
    shopLine: "+10% +$ on Money wheel",
    bullets: ["Stacks Lucky Money"],
  },
  gold_rush: {
    tagline: "Cash boost",
    shopLine: "+20% from +$ wedges",
    bullets: ["+1 chip on cash wins"],
  },
  safe_harbor: {
    tagline: "Softer hits",
    shopLine: "−20% Risk & Chaos losses",
    bullets: ["+1 shield on buy"],
  },
  coupon_king: {
    tagline: "Shop sale",
    shopLine: "Shop prices −15%",
    bullets: ["Chips only"],
  },
  hot_table: {
    tagline: "Rare hunt",
    shopLine: "+10% rare wedges",
    bullets: ["Jackpots & perks"],
  },
  vip_roller: {
    tagline: "% boost",
    shopLine: "+15% from +% wedges",
    bullets: ["Percent wheel"],
  },
  double_down: {
    tagline: "One double",
    shopLine: "Next +$ wedge ×2",
    bullets: ["Once per run"],
  },
  compounder: {
    tagline: "Scale up",
    shopLine: "+5% cash per cycle cleared",
    bullets: ["Stacks forever"],
  },
  final_guard: {
    tagline: "Final armor",
    shopLine: "−15% on Final wheel",
    bullets: ["Wheel 9"],
  },
  final_tax_shield: {
    tagline: "Tax cap",
    shopLine: "Perk tax capped at 15% bank",
    bullets: ["Final wheel only"],
  },
  clutch_cash: {
    tagline: "Final payday",
    shopLine: "+$50 entering Final wheel",
    bullets: ["Once per cycle"],
  },
  green_fever: {
    tagline: "Green bias",
    shopLine: "+5% all green wedges",
    bullets: ["Every wheel"],
  },
  chip_drip: {
    tagline: "Chip drip",
    shopLine: "+1 chip on cash wins",
    bullets: ["Stacks with Gold Rush"],
  },
  deep_pockets: {
    tagline: "Deep run",
    shopLine: "+4 chips on cycle clear",
    bullets: ["+1 more per cycle #"],
  },
  drain_ward: {
    tagline: "Drain ward",
    shopLine: "−10% Drain wheel (W5)",
    bullets: ["Losses only"],
  },
  chaos_ward: {
    tagline: "Chaos guard",
    shopLine: "−12% Chaos wheel (W8)",
    bullets: ["Stacks Safe Harbor"],
  },
  streak_spark: {
    tagline: "Hot streak",
    shopLine: "+1 chip on cash wins",
    bullets: ["Needs win streak 2+"],
  },
  jackpot_hunter: {
    tagline: "W6 hunt",
    shopLine: "+8% rare on Lucky wheel",
    bullets: ["Jackpots & perks"],
  },
  purify_touch: {
    tagline: "Cleanse",
    shopLine: "Remove oldest curse",
    bullets: ["+5 chips if you have none"],
  },
  hex_ward: {
    tagline: "Curse resist",
    shopLine: "30% resist new curses",
    bullets: ["Stacks with shields"],
  },
  ghost_repel: {
    tagline: "Boss Ghost",
    shopLine: "Boss Ghost half strength",
    bullets: ["Less red wedges this cycle"],
  },
  money_stream: {
    tagline: "W1 stream",
    shopLine: "+6% +$ on Money wheel",
    bullets: ["Stacks Lucky Money"],
  },
  percent_focus: {
    tagline: "W2 focus",
    shopLine: "+6% +% on Percent wheel",
    bullets: ["Stacks Lucky Percent"],
  },
  curse_break: {
    tagline: "Full cleanse",
    shopLine: "Remove all curses",
    bullets: ["One-time on buy"],
  },
  cycle_momentum: {
    tagline: "Long run",
    shopLine: "+2 chips every 5 cycles",
    bullets: ["Cycle 5, 10, 15…"],
  },
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
  };
  return names[perkId] ?? perkId;
}
