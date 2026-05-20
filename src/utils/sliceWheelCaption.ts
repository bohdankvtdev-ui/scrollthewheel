import type { SliceDefinition } from "../schemas";

import { PERK_CATALOG } from "../data/perks";

import {

  deckAddWheelCaption,

  DECK_REMOVE_WHEEL_CAPTION,

  DECK_UPGRADE_WHEEL_CAPTION,

} from "../game/deck/sliceLabels";



/** Short wedge label for on-wheel readability (2–6 chars). */

export function sliceWheelCaption(slice: SliceDefinition): string {

  const { payload, kind } = slice;

  if (payload.wipeBank || kind === "bank_wipe") return "ALL";

  if (payload.bankPercent != null && payload.bankPercent < 0) {
    return `-${Math.round(Math.abs(payload.bankPercent) * 100)}%`;
  }

  if (payload.bankPercent != null && payload.bankPercent > 0) {
    return payload.bankPercent >= 1 ? "×2" : `+${Math.round(payload.bankPercent * 100)}%`;
  }

  if (payload.moneyDelta != null && payload.moneyDelta > 0) {

    const n = payload.moneyDelta;

    if (n >= 1000) return "+1K";

    if (n >= 100) return `+${n}`;

    return `+${n}`;

  }

  if (payload.moneyDelta != null && payload.moneyDelta < 0) {

    const n = Math.abs(payload.moneyDelta);

    return n >= 100 ? `-${n}` : `-${n}`;

  }

  if (payload.perkId != null) {

    const abbrev: Record<string, string> = {

      lucky_streak: "LUCK",

      gold_rush: "GOLD",

      iron_reserve: "SHLD",

      safe_harbor: "SAFE",

      high_roller: "ROLL",

      vip_roller: "VIP",

      hot_table: "HOT",

      double_down: "×2$",

      coupon_king: "SALE",

      ante_insurance: "CUT",

      compounder: "STACK",

    };

    const short = abbrev[payload.perkId];

    if (short != null) return short;

    const p = PERK_CATALOG[payload.perkId];

    if (p != null) return p.name.slice(0, 4).toUpperCase();

    return "PERK";

  }

  if (payload.debuffId != null) return "CURSE";

  if (payload.relicId != null) return "RELIC";

  if (payload.cardId != null && kind === "deck_add") {

    return deckAddWheelCaption(payload.cardId);

  }

  if (kind === "deck_remove") return DECK_REMOVE_WHEEL_CAPTION;

  if (kind === "deck_upgrade") return DECK_UPGRADE_WHEEL_CAPTION;

  if (kind === "neutral") {
    if (slice.label.toLowerCase().includes("nothing") || slice.id.includes("nothing")) {
      return "NONE";
    }
    return "—";
  }

  return slice.label.slice(0, 6);

}

