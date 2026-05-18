import type { WheelArchetype } from "../wheels/types";

/** Where an effect applies — one scope per perk. */
export type EffectScope =
  | "all_positive"
  | "money_wheel"
  | "perk_wheel"
  | "percent_wheel"
  | "risk_chaos"
  | "boss_wheel"
  | "money_payout"
  | "percent_payout"
  | "shop"
  | "cycle_quota"
  | "on_acquire";

export type EffectKind =
  | "land_weight"
  | "payout_mult"
  | "bank_gain_mult"
  | "loss_mult"
  | "quota_mult"
  | "shield"
  | "next_payout_double"
  | "cycle_money_growth";

export type PerkEffectDef = {
  perkId: string;
  scope: EffectScope;
  kind: EffectKind;
  /** Human line for shop / slice sheet */
  line: string;
  value: number;
};

export function archetypeMatchesScope(
  archetype: WheelArchetype | null,
  scope: EffectScope
): boolean {
  if (archetype == null) return false;
  switch (scope) {
    case "money_wheel":
      return archetype === "money";
    case "perk_wheel":
      return archetype === "joker_offer";
    case "percent_wheel":
      return archetype === "percent";
    case "risk_chaos":
      return archetype === "risk" || archetype === "chaos" || archetype === "drain";
    case "boss_wheel":
      return archetype === "boss";
    case "all_positive":
      return true;
    default:
      return false;
  }
}
