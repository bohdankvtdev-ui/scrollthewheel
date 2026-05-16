import type { SliceDefinition, SliceKind } from "../schemas";
import { DEBUFF_CATALOG } from "../data/debuffs";
import { PERK_CATALOG } from "../data/perks";
import { RELIC_CATALOG } from "../data/relics";
import { resolveSliceIcon } from "../game/content/resolveIcon";
import { sliceWheelCaption } from "./sliceWheelCaption";

export type SliceDisplay = {
  icon: string;
  iconFamily: SliceDefinition["iconFamily"];
  shortLabel: string;
  effectHint: string;
};

const KIND_HINT: Partial<Record<SliceKind, string>> = {
  money: "Gain cash",
  money_loss: "Lose cash",
  perk: "New perk",
  debuff: "Curse applied",
  deck_add: "Card added",
  deck_remove: "Card removed",
  deck_upgrade: "Card upgraded",
  relic_offer: "Relic found",
  booster: "Bonus cash",
  neutral: "No change",
  bank_wipe: "Lose entire bank",
  bank_cut: "Lose % of bank",
};

export function describeSliceEffect(slice: SliceDefinition): string {
  const { payload, kind } = slice;
  if (payload.moneyDelta != null && payload.moneyDelta > 0) {
    return `+$${payload.moneyDelta}`;
  }
  if (payload.moneyDelta != null && payload.moneyDelta < 0) {
    return `-$${Math.abs(payload.moneyDelta)}`;
  }
  if (payload.perkId != null) {
    const perk = PERK_CATALOG[payload.perkId];
    return perk != null ? `Won: ${perk.name}` : "New perk!";
  }
  if (payload.debuffId != null) {
    return DEBUFF_CATALOG[payload.debuffId]?.description ?? "Debuff";
  }
  if (payload.relicId != null) {
    return RELIC_CATALOG[payload.relicId]?.description ?? "Relic";
  }
  if (payload.wipeBank) return "LOSE ALL CASH";
  if (payload.bankPercent != null && payload.bankPercent < 0) {
    return `LOSE ${Math.round(Math.abs(payload.bankPercent) * 100)}% bank`;
  }
  if (payload.bankPercent != null && payload.bankPercent > 0) {
    return `+${Math.round(payload.bankPercent * 100)}% bank`;
  }
  if (payload.sliceDelta != null && payload.sliceDelta > 0) {
    return `+${payload.sliceDelta} slice on next wheel`;
  }
  if (payload.expandSlicesTo != null) {
    return `+1 slice on next wheel`;
  }
  return KIND_HINT[kind] ?? slice.label;
}

export function toSliceDisplay(slice: SliceDefinition): SliceDisplay {
  const visual = resolveSliceIcon(slice);
  return {
    icon: visual.icon,
    iconFamily: visual.iconFamily,
    shortLabel: sliceWheelCaption(slice),
    effectHint: describeSliceEffect(slice),
  };
}
