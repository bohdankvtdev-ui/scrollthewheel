import type { PerkEffectDef } from "./types";

/**
 * One perk → one primary effect. Shop copy and runtime logic read from here.
 */
export const PERK_EFFECT_REGISTRY: Record<string, PerkEffectDef> = {
  lucky_money: {
    perkId: "lucky_money",
    scope: "money_wheel",
    kind: "land_weight",
    value: 1.12,
    line: "+12% land chance on Money wheel cash wedges",
  },
  lucky_perk: {
    perkId: "lucky_perk",
    scope: "perk_wheel",
    kind: "land_weight",
    value: 1.12,
    line: "+12% land chance on Perk wheel offers",
  },
  lucky_streak: {
    perkId: "lucky_streak",
    scope: "all_positive",
    kind: "land_weight",
    value: 1.1,
    line: "+10% land chance on every positive wedge",
  },
  high_roller: {
    perkId: "high_roller",
    scope: "money_wheel",
    kind: "land_weight",
    value: 1.1,
    line: "+10% land chance on Money wheel (stacks with Lucky Money)",
  },
  hot_table: {
    perkId: "hot_table",
    scope: "all_positive",
    kind: "land_weight",
    value: 1.1,
    line: "+10% land chance on rare-tagged wedges",
    /** Applied via rare tag mult, not positiveWeightMult */
  },
  gold_rush: {
    perkId: "gold_rush",
    scope: "money_payout",
    kind: "payout_mult",
    value: 1.25,
    line: "+25% cash from money wedges only",
  },
  vip_roller: {
    perkId: "vip_roller",
    scope: "percent_payout",
    kind: "bank_gain_mult",
    value: 1.15,
    line: "+15% bank gained from percent wheel gains",
  },
  compounder: {
    perkId: "compounder",
    scope: "money_payout",
    kind: "payout_mult",
    value: 0.05,
    line: "+5% cash per cycle cleared (stacks)",
  },
  double_down: {
    perkId: "double_down",
    scope: "money_payout",
    kind: "next_payout_double",
    value: 2,
    line: "Next positive cash wedge pays ×2",
  },
  safe_harbor: {
    perkId: "safe_harbor",
    scope: "risk_chaos",
    kind: "loss_mult",
    value: 0.8,
    line: "−20% cash lost on Risk / Chaos / Drain wheels",
  },
  iron_reserve: {
    perkId: "iron_reserve",
    scope: "on_acquire",
    kind: "shield",
    value: 1,
    line: "+1 shield when acquired",
  },
  coupon_king: {
    perkId: "coupon_king",
    scope: "shop",
    kind: "payout_mult",
    value: 0.85,
    line: "Shop prices ×0.85",
  },
  ante_insurance: {
    perkId: "ante_insurance",
    scope: "cycle_quota",
    kind: "quota_mult",
    value: 0.88,
    line: "Cycle bonus bank target −12%",
  },
};

export function getPerkEffect(perkId: string): PerkEffectDef | undefined {
  return PERK_EFFECT_REGISTRY[perkId];
}

export function listPerkEffects(perkIds: string[]): PerkEffectDef[] {
  return perkIds.map((id) => PERK_EFFECT_REGISTRY[id]).filter((d): d is PerkEffectDef => d != null);
}
