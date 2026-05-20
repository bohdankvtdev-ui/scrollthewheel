import type { WheelArchetype } from "../wheels/types";
import type { ResolveContext } from "../../systems/types";
import { listPerkEffects } from "./perkEffects";

/** Spin odds — perks boost only matching slice kinds / tags */
export function applyPerkSpinEffects(
  ctx: ResolveContext,
  perkIds: string[],
  archetype: WheelArchetype | null
): ResolveContext {
  let next = { ...ctx, tagMults: { ...ctx.tagMults }, kindWeightMults: { ...ctx.kindWeightMults } };

  for (const e of listPerkEffects(perkIds)) {
    if (e.kind !== "land_weight") continue;
    if (e.scope === "all_positive") {
      next = { ...next, positiveWeightMult: next.positiveWeightMult * e.value };
    }
  }

  if (archetype === "money") {
    let moneyMult = 1;
    for (const e of listPerkEffects(perkIds)) {
      if (e.kind === "land_weight" && e.scope === "money_wheel") {
        moneyMult *= e.value;
      }
    }
    if (moneyMult > 1) {
      next = {
        ...next,
        kindWeightMults: { ...next.kindWeightMults, money: (next.kindWeightMults?.money ?? 1) * moneyMult },
      };
    }
  }

  if (archetype === "joker_offer") {
    let perkMult = 1;
    for (const e of listPerkEffects(perkIds)) {
      if (e.kind === "land_weight" && e.scope === "perk_wheel") {
        perkMult *= e.value;
      }
    }
    if (perkMult > 1) {
      next = {
        ...next,
        kindWeightMults: { ...next.kindWeightMults, perk: (next.kindWeightMults?.perk ?? 1) * perkMult },
      };
    }
  }

  if (archetype === "percent") {
    let pctMult = 1;
    for (const e of listPerkEffects(perkIds)) {
      if (e.kind === "land_weight" && e.scope === "percent_wheel") {
        pctMult *= e.value;
      }
    }
    if (pctMult > 1) {
      next = { ...next, positiveWeightMult: next.positiveWeightMult * pctMult };
    }
  }

  if (archetype === "lucky" && perkIds.includes("jackpot_hunter")) {
    next = {
      ...next,
      tagMults: { ...next.tagMults, rare: (next.tagMults.rare ?? 1) * 1.08 },
    };
  }

  if (perkIds.includes("hot_table")) {
    next = {
      ...next,
      tagMults: { ...next.tagMults, rare: (next.tagMults.rare ?? 1) * 1.1 },
    };
  }

  return next;
}

export function applyPerkMoneyPayout(
  rawDelta: number,
  perkIds: string[],
  floorsCleared: number
): number {
  if (rawDelta <= 0) return rawDelta;
  let delta = rawDelta;

  const gold = listPerkEffects(perkIds).find((e) => e.perkId === "gold_rush");
  if (gold != null) delta = Math.floor(delta * gold.value);

  const compounder = listPerkEffects(perkIds).find((e) => e.perkId === "compounder");
  if (compounder != null) {
    delta = Math.floor(delta * (1 + Math.max(0, floorsCleared) * compounder.value));
  }

  return delta;
}

export function applyPerkPercentGain(
  amount: number,
  perkIds: string[],
  percentGainMult = 1
): number {
  if (amount <= 0) return amount;
  let out = amount * percentGainMult;
  const vip = listPerkEffects(perkIds).find((e) => e.perkId === "vip_roller");
  if (vip != null) out *= vip.value;
  return Math.floor(out);
}

export function applyPerkLossMult(
  rawDelta: number,
  perkIds: string[],
  archetype: WheelArchetype | null
): number {
  if (rawDelta >= 0) return rawDelta;
  if (archetype === "drain" && perkIds.includes("drain_ward")) {
    return Math.floor(rawDelta * 0.9);
  }
  if (archetype === "chaos" && perkIds.includes("chaos_ward")) {
    return Math.floor(rawDelta * 0.88);
  }
  if (archetype !== "risk" && archetype !== "chaos" && archetype !== "drain") return rawDelta;
  const harbor = listPerkEffects(perkIds).find((e) => e.perkId === "safe_harbor");
  if (harbor != null) return Math.floor(rawDelta * harbor.value);
  return rawDelta;
}
