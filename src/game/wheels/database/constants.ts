import type { SliceKind } from "../../../schemas";
import type { WheelArchetype } from "../types";

/** Default wedge count at cycle 1 before cycle scaling and advancement injects. */
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
  boss: ["bank_cut", "bank_wipe", "money", "money_loss", "run_effect", "debuff", "neutral", "perk", "relic_offer"],
};
