import type { SliceDefinition } from "../schemas";
import { PERK_CATALOG } from "../data/perks";

/** Short wedge label for on-wheel readability (2–6 chars). */
export function sliceWheelCaption(slice: SliceDefinition): string {
  const { payload, kind } = slice;
  if (payload.wipeBank || kind === "bank_wipe") return "ALL";
  if (payload.bankPercent != null && payload.bankPercent < 0) {
    return `${Math.round(Math.abs(payload.bankPercent) * 100)}%`;
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
      extra_slice: "+1",
      slice_expander: "+1",
      lucky_streak: "LUCK",
      gold_rush: "GOLD",
      iron_reserve: "SHLD",
      safe_harbor: "SAFE",
      high_roller: "HIGH",
      vip_roller: "VIP",
      hot_table: "HOT",
      double_down: "×2$",
      coupon_king: "DEAL",
      ante_insurance: "INS",
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
  if (payload.sliceDelta != null && payload.sliceDelta > 0) return `+${payload.sliceDelta}`;
  if (kind === "deck_add") return "CHIP";
  if (kind === "deck_remove") return "BURN";
  if (kind === "deck_upgrade") return "UP";
  if (kind === "neutral") return "—";
  return slice.label.slice(0, 5);
}
