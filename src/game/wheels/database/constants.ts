import type { SliceKind } from "../../../schemas";
import type { WheelArchetype } from "../types";

/** Every wheel in the database has exactly six wedges — no capacity upgrades. */
export const SLICES_PER_WHEEL = 6 as const;

/** Which slice kinds belong on each wheel archetype (themed, not random mix). */
export const WHEEL_THEME_KINDS: Record<WheelArchetype, readonly SliceKind[]> = {
  money: ["money", "money_loss"],
  percent: ["bank_cut", "bank_wipe"],
  risk: ["money", "money_loss", "debuff", "neutral", "run_effect", "bank_cut"],
  joker_offer: ["perk"],
  drain: ["money_loss", "debuff", "bank_cut", "run_effect"],
  lucky: ["money", "perk", "relic_offer"],
  builder: ["deck_add", "deck_remove", "deck_upgrade", "neutral"],
  chaos: ["bank_wipe", "bank_cut", "money_loss", "debuff", "run_effect", "neutral"],
  boss: ["bank_cut", "bank_wipe", "money", "perk", "run_effect", "relic_offer", "debuff"],
};
