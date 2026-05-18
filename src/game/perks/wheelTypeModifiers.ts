import { getBossLossMult } from "../boss/bossWheel";
import type { WheelArchetype } from "../wheels/types";
import type { ResolveContext } from "../../systems/types";
import type { RunState } from "../runState/types";

export type WheelModifierAdjustments = {
  contextPatch: Partial<ResolveContext>;
  moneyGainMult: number;
  moneyLossMult: number;
};

const NEUTRAL: WheelModifierAdjustments = {
  contextPatch: {},
  moneyGainMult: 1,
  moneyLossMult: 1,
};

/** Balatro-style synergies keyed to wheel archetype + perks/relics. */
export function getWheelTypeAdjustments(
  run: RunState,
  archetype: WheelArchetype | null,
  spinCount: number
): WheelModifierAdjustments {
  if (archetype == null) return NEUTRAL;

  let ctx: Partial<ResolveContext> = {};
  let moneyGainMult = 1;
  let moneyLossMult = 1;

  if (run.relics.includes("coin_magnet") && archetype === "money") {
    moneyGainMult *= 1.15;
    ctx = {
      ...ctx,
      positiveWeightMult: (ctx.positiveWeightMult ?? 1) * 1.1,
    };
  }

  if (run.relics.includes("firewall") && (run.runEffects?.corruptionRemainingWheels ?? 0) > 0) {
    return {
      contextPatch: { negativeWeightMult: 1 },
      moneyGainMult: 1,
      moneyLossMult: 1,
    };
  }

  if (archetype === "risk" || archetype === "chaos") {
    if (run.runEffects?.safeHarborActive || run.perks.includes("safe_harbor")) {
      moneyLossMult *= 0.8;
    }
    if (run.relics.includes("void_lens")) {
      ctx = { ...ctx, negativeWeightMult: (ctx.negativeWeightMult ?? 1) * 0.85 };
    }
  }

  if (archetype === "boss") {
    moneyLossMult *= getBossLossMult(run);
    moneyGainMult *= 0.82;
    if (run.perks.includes("final_guard")) {
      moneyLossMult *= 0.85;
    }
    if (run.relics.includes("boss_slayer")) {
      ctx = {
        ...ctx,
        negativeWeightMult: (ctx.negativeWeightMult ?? 1) * 0.9,
      };
      moneyLossMult *= 0.92;
    }
  }

  if (run.relics.includes("hot_hand") && spinCount > 0 && spinCount % 5 === 0) {
    ctx = {
      ...ctx,
      positiveWeightMult: (ctx.positiveWeightMult ?? 1) * 1.25,
      tagMults: { ...ctx.tagMults, rare: (ctx.tagMults?.rare ?? 1) * 1.2 },
    };
  }

  return { contextPatch: ctx, moneyGainMult, moneyLossMult };
}

export function mergeWheelTypeContext(
  base: ResolveContext,
  adj: WheelModifierAdjustments
): ResolveContext {
  const tagMults = { ...base.tagMults, ...adj.contextPatch.tagMults };
  return {
    ...base,
    ...adj.contextPatch,
    tagMults,
    positiveWeightMult:
      (base.positiveWeightMult ?? 1) * (adj.contextPatch.positiveWeightMult ?? 1),
    negativeWeightMult:
      (base.negativeWeightMult ?? 1) * (adj.contextPatch.negativeWeightMult ?? 1),
    wheelNegativeBias:
      (base.wheelNegativeBias ?? 0) + (adj.contextPatch.wheelNegativeBias ?? 0),
  };
}
