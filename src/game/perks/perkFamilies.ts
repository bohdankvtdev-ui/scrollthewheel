import type { PerkCategory } from "../../data/perks";

/** Player-facing perk families (shop badges & loadout grouping). */
export type PerkFamily = "bank" | "odds" | "defense" | "shop" | "final";

export const PERK_FAMILY_LABELS: Record<PerkFamily, string> = {
  bank: "Bank",
  odds: "Odds",
  defense: "Defense",
  shop: "Run",
  final: "Final",
};

export const PERK_FAMILY_COLORS: Record<
  PerkFamily,
  { bg: string; accent: string; cardTint: string; border: string }
> = {
  bank: { bg: "#FFE94D", accent: "#713F12", cardTint: "rgba(255, 233, 77, 0.18)", border: "#FFE94D" },
  odds: { bg: "#C4B5FD", accent: "#5B21B6", cardTint: "rgba(196, 181, 253, 0.2)", border: "#C4B5FD" },
  defense: { bg: "#38BDF8", accent: "#075985", cardTint: "rgba(56, 189, 248, 0.16)", border: "#38BDF8" },
  shop: { bg: "#4ADE80", accent: "#166534", cardTint: "rgba(74, 222, 128, 0.16)", border: "#4ADE80" },
  final: { bg: "#FF6B9D", accent: "#9F1239", cardTint: "rgba(255, 107, 157, 0.18)", border: "#FF6B9D" },
};

const CATEGORY_TO_FAMILY: Record<PerkCategory, PerkFamily> = {
  economy: "bank",
  wheel: "odds",
  defense: "defense",
  meta: "shop",
};

const PERK_FAMILY_OVERRIDE: Partial<Record<string, PerkFamily>> = {
  final_guard: "final",
  final_tax_shield: "final",
  clutch_cash: "final",
};

export function getPerkFamily(perkId: string, category: PerkCategory): PerkFamily {
  return PERK_FAMILY_OVERRIDE[perkId] ?? CATEGORY_TO_FAMILY[category];
}
