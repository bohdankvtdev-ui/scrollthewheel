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

  /** One sentence on the shop card */

  shopLine: string;

  /** 2–4 short bullets in the detail sheet */

  bullets: string[];

};



/** Plain-language copy keyed by perk id — keep in sync with PerkSystem / jokerEngine / useWheelModifiers. */

export const PERK_DISPLAY: Record<string, PerkDisplayCopy> = {

  lucky_money: {
    tagline: "Money wheel luck",
    shopLine: perkLine("lucky_money"),
    bullets: [perkLine("lucky_money"), "Only affects the Money wheel (wheel 1)"],
  },

  lucky_perk: {
    tagline: "Perk wheel luck",
    shopLine: perkLine("lucky_perk"),
    bullets: [perkLine("lucky_perk"), "Only affects the Perk wheel (wheel 4)"],
  },

  lucky_streak: {
    tagline: "All-around luck",
    shopLine: perkLine("lucky_streak"),
    bullets: [perkLine("lucky_streak"), "+2 shop chips on cash wins (meta)"],
  },

  iron_reserve: {

    tagline: "Block one hit",

    shopLine: "+1 shield when acquired",

    bullets: [

      "Grants one shield immediately when you get this perk",

      "A shield blocks one flat $ loss, % bank cut, or wipe",

      "The shield is consumed when it blocks — not permanent",

      "Pairs with Safe Harbor for two shields total",

    ],

  },

  ante_insurance: {
    tagline: "Cycle chip bonus",
    shopLine: perkLine("ante_insurance"),
    bullets: [
      perkLine("ante_insurance"),
      "Stacks when you clear wheel 9 and start the next cycle",
    ],
  },

  high_roller: {
    tagline: "Money wheel odds",
    shopLine: perkLine("high_roller"),
    bullets: [perkLine("high_roller"), "Stacks with Lucky Money"],
  },

  gold_rush: {
    tagline: "Cash payout",
    shopLine: perkLine("gold_rush"),
    bullets: [perkLine("gold_rush"), "+1 shop chip when a money wedge pays"],
  },

  safe_harbor: {

    tagline: "Extra shield",

    shopLine: "+1 shield when acquired (stacks with Iron Shield)",

    bullets: [

      "Adds one shield immediately when bought or won on a wedge",

      "Each shield blocks one bank hit, then is used up",

      "Two shields can absorb two bad outcomes in a row",

    ],

  },

  coupon_king: {

    tagline: "Cheaper shop",

    shopLine: "Joker shop prices −15% (shop chips, not bank $)",

    bullets: [

      "Buy, sell refund, and reroll all cost fewer shop chips",

      "Applies for the rest of the run",

      "Does not change wedge payouts or bank money",

    ],

  },

  hot_table: {
    tagline: "Rare slices",
    shopLine: perkLine("hot_table"),
    bullets: [perkLine("hot_table"), "Jackpots, perks, relic offers"],
  },

  vip_roller: {
    tagline: "Percent gains",
    shopLine: perkLine("vip_roller"),
    bullets: [perkLine("vip_roller"), "Only when a % wedge adds to your bank"],
  },

  double_down: {
    tagline: "One double payday",
    shopLine: perkLine("double_down"),

    bullets: [

      "Doubles the next wedge that adds flat $ only",

      "Consumed after it triggers once",

      "Save it for a big +$ wedge on Lucky or Boss",

    ],

  },

  compounder: {
    tagline: "Scale with cycles",
    shopLine: perkLine("compounder"),
    bullets: [perkLine("compounder"), "Bonus shop chips each cycle end"],
  },

};



export function getPerkDisplay(perkId: string): PerkDisplayCopy | null {

  return PERK_DISPLAY[perkId] ?? null;

}



/** Wheel wedge label for a perk prize — matches `PERK_CATALOG` display names. */

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

  };

  return names[perkId] ?? perkId;

}

