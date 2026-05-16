/**
 * ═══════════════════════════════════════════════════════════════════
 *  WHEEL DATABASE — edit wheels, visible slices & land % here
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Model (testable prototype):
 *  • Each wheel has its OWN `prizes` list → those are the slices on the wheel.
 *  • `chance` = land % on spin (should sum to 100 per wheel).
 *  • `chance: 0` → slice is VISIBLE but never wins (e.g. force +$200 test).
 *
 *  npm run validate:wheels   npm run preview:wheels
 */

import type { WheelConfigEntry, WheelConfigId } from "./types";

/** Bump when slice layout / chances change — forces saved runs to rebuild wheels. */
export const WHEEL_DATABASE_REVISION = 3;

export const FLOOR_WHEEL_ORDER = [
  "wheel_1",
  "wheel_2",
  "wheel_3",
  "wheel_4",
  "wheel_5",
  "wheel_6",
  "wheel_7",
  "wheel_8",
  "wheel_9",
  "wheel_10",
] as const satisfies readonly WheelConfigId[];

export type FloorWheelOrderId = (typeof FLOOR_WHEEL_ORDER)[number];

export const WHEEL_DATABASE: Record<FloorWheelOrderId, WheelConfigEntry> = {
  wheel_1: {
    title: "Money Wheel",
    archetype: "money",
    role: "yield",
    physicsProfileId: "default",
    prizes: [
      { prize: "money_200", chance: 0 },
      { prize: "money_120", chance: 100 },
      { prize: "perk_gold_rush", chance: 0 },
      { prize: "deck_copper_chip", chance: 0 },
      { prize: "perk_lucky_streak", chance: 0 },
 
      { prize: "perk_safe_harbor", chance: 0 },
    ],
  },

  wheel_2: {
    title: "Percent Wheel",
    archetype: "percent",
    role: "mini_boss",
    physicsProfileId: "boss",
    modifiers: { stakesBoost: 0.2 },
    prizes: [
      { prize: "money_loss_150", chance: 23 },
      { prize: "bank_cut_half", chance: 15 },
      { prize: "money_200", chance: 15 },
      { prize: "perk_gold_rush", chance: 15 },
      { prize: "perk_lucky_streak", chance: 15 },
      { prize: "neutral_hold", chance: 8 },
      { prize: "perk_vip_roller", chance: 9 },
    ],
  },

  wheel_3: {
    title: "Risk Wheel",
    archetype: "risk",
    role: "risk",
    modifiers: { forceNegativeBias: 0.1 },
    prizes: [
      { prize: "money_500", chance: 8 },
      { prize: "money_150", chance: 23 },
      { prize: "money_loss_200", chance: 15 },
      { prize: "perk_gold_rush", chance: 15 },
      { prize: "debuff_debt_mark", chance: 15 },
      { prize: "neutral_gamble", chance: 8 },
      { prize: "perk_hot_table", chance: 8 },
      { prize: "perk_double_down", chance: 8 },
    ],
  },

  wheel_4: {
    title: "Joker Offer Wheel",
    archetype: "joker_offer",
    role: "power",
    modifiers: { perkBoost: 0.45 },
    prizes: [
      { prize: "perk_lucky_streak", chance: 19 },
      { prize: "perk_gold_rush", chance: 14 },
      { prize: "perk_iron_reserve", chance: 14 },
      { prize: "perk_extra_slice", chance: 10 },
      { prize: "perk_hot_table", chance: 10 },
      { prize: "money_150", chance: 10 },
      { prize: "perk_safe_harbor", chance: 10 },
      { prize: "perk_high_roller", chance: 10 },
      { prize: "relic_void_lens", chance: 3 },
    ],
  },

  wheel_5: {
    title: "Drain Wheel",
    archetype: "drain",
    role: "risk",
    modifiers: { forceNegativeBias: 0.18 },
    prizes: [
      { prize: "money_loss_80", chance: 21 },
      { prize: "debuff_debt_mark", chance: 21 },
      { prize: "debuff_rusted", chance: 14 },
      { prize: "bank_cut_quarter", chance: 14 },
      { prize: "money_80", chance: 14 },
      { prize: "perk_iron_reserve", chance: 7 },
      { prize: "neutral", chance: 9 },
    ],
  },

  wheel_6: {
    title: "Lucky Wheel",
    archetype: "lucky",
    role: "jackpot",
    prizes: [
      { prize: "money_1000", chance: 7 },
      { prize: "money_300", chance: 14 },
      { prize: "money_150", chance: 21 },
      { prize: "perk_lucky_streak", chance: 14 },
      { prize: "money_loss_100", chance: 14 },
      { prize: "relic_lucky_coin", chance: 7 },
      { prize: "perk_vip_roller", chance: 7 },
      { prize: "perk_high_roller", chance: 16 },
    ],
  },

  wheel_7: {
    title: "Builder Wheel",
    archetype: "builder",
    role: "deck",
    prizes: [
      { prize: "deck_copper_chip", chance: 23 },
      { prize: "deck_weighted_die", chance: 15 },
      { prize: "deck_upgrade", chance: 15 },
      { prize: "money_80", chance: 15 },
      { prize: "deck_remove", chance: 8 },
      { prize: "neutral", chance: 8 },
      { prize: "deck_purity_charm", chance: 16 },
    ],
  },

  wheel_8: {
    title: "Jackpot Wheel",
    archetype: "jackpot",
    role: "jackpot",
    modifiers: { perkBoost: 0.1 },
    prizes: [
      { prize: "money_1000", chance: 7 },
      { prize: "money_300", chance: 14 },
      { prize: "money_150", chance: 21 },
      { prize: "relic_lucky_coin", chance: 7 },
      { prize: "perk_lucky_streak", chance: 14 },
      { prize: "money_loss_100", chance: 14 },
      { prize: "perk_vip_roller", chance: 7 },
      { prize: "perk_high_roller", chance: 16 },
    ],
  },

  wheel_9: {
    title: "Curse Wheel",
    archetype: "curse",
    role: "stabilizer",
    modifiers: { forceNegativeBias: 0.12 },
    prizes: [
      { prize: "money_loss_80", chance: 21 },
      { prize: "debuff_debt_mark", chance: 21 },
      { prize: "debuff_rusted", chance: 14 },
      { prize: "bank_cut_quarter", chance: 14 },
      { prize: "money_600", chance: 14 },
      { prize: "perk_iron_reserve", chance: 7 },
      { prize: "neutral", chance: 9 },
    ],
  },

  wheel_10: {
    title: "Boss Wheel",
    archetype: "boss",
    role: "boss",
    physicsProfileId: "boss",
    modifiers: { stakesBoost: 0.4, forceNegativeBias: 0.08 },
    prizes: [
      { prize: "bank_wipe", chance: 8 },
      { prize: "bank_cut_75", chance: 17 },
      { prize: "money_800", chance: 17 },
      { prize: "perk_vip_roller", chance: 17 },
      { prize: "perk_extra_slice", chance: 17 },
      { prize: "bank_double", chance: 17 },
      { prize: "perk_compounder", chance: 7 },
    ],
  },
};
