import type { WheelArchetype } from "../wheels/types";
import type { ResolveContext } from "../../systems/types";
import { listPerkEffects } from "./perkEffects";

export function countPerkStacks(perkIds: string[], perkId: string): number {
  return perkIds.filter((id) => id === perkId).length;
}

function stackedMult(perkIds: string[], perkId: string, perStack: number): number {
  const n = countPerkStacks(perkIds, perkId);
  return n > 0 ? Math.pow(perStack, n) : 1;
}

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

  const jackpotStacks = countPerkStacks(perkIds, "jackpot_hunter");
  if (archetype === "lucky" && jackpotStacks > 0) {
    next = {
      ...next,
      tagMults: { ...next.tagMults, rare: (next.tagMults.rare ?? 1) * Math.pow(1.08, jackpotStacks) },
    };
  }

  const hotStacks = countPerkStacks(perkIds, "hot_table");
  if (hotStacks > 0) {
    next = {
      ...next,
      tagMults: { ...next.tagMults, rare: (next.tagMults.rare ?? 1) * Math.pow(1.1, hotStacks) },
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

  delta = Math.floor(delta * stackedMult(perkIds, "gold_rush", 1.12));
  delta = Math.floor(delta * stackedMult(perkIds, "bank_bloom", 1.12));

  const compounderStacks = countPerkStacks(perkIds, "compounder");
  if (compounderStacks > 0) {
    const compounder = listPerkEffects(perkIds).find((e) => e.perkId === "compounder");
    const rate = compounder?.value ?? 0.04;
    delta = Math.floor(delta * (1 + Math.max(0, floorsCleared) * rate * compounderStacks));
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
  out *= stackedMult(perkIds, "vip_roller", 1.15);
  return Math.floor(out);
}

export function applyPerkLossMult(
  rawDelta: number,
  perkIds: string[],
  archetype: WheelArchetype | null
): number {
  if (rawDelta >= 0) return rawDelta;
  let delta = rawDelta;

  if (archetype === "drain") {
    delta = Math.floor(delta * stackedMult(perkIds, "drain_ward", 0.9));
  }
  if (archetype === "chaos") {
    delta = Math.floor(delta * stackedMult(perkIds, "chaos_ward", 0.88));
  }

  if (archetype === "risk" || archetype === "chaos" || archetype === "drain") {
    delta = Math.floor(delta * stackedMult(perkIds, "safe_harbor", 0.8));
    delta = Math.floor(delta * stackedMult(perkIds, "bleed_slow", 0.92));
  }

  if (archetype === "boss") {
    delta = Math.floor(delta * stackedMult(perkIds, "final_guard", 0.85));
  }

  return delta;
}
