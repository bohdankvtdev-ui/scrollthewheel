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

export const PERK_FAMILY_COLORS: Record<PerkFamily, { bg: string; accent: string }> = {
  bank: { bg: "#FEF9C3", accent: "#A16207" },
  odds: { bg: "#EDE9FE", accent: "#6D28D9" },
  defense: { bg: "#DBEAFE", accent: "#1D4ED8" },
  shop: { bg: "#CFFAFE", accent: "#0E7490" },
  final: { bg: "#FEE2E2", accent: "#B91C1C" },
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
