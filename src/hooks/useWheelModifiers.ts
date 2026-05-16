import { useMemo } from "react";
import type { RunState, ResolvedWheel } from "../schemas";
import { DEBUFF_CATALOG } from "../data/debuffs";
import { getScalingParams } from "../systems/InfiniteScaling";
import { mergeDeckContext } from "../systems/DeckSystem";
import { mergeRelicContext } from "../systems/RelicSystem";
import { DEFAULT_RESOLVE_CONTEXT, type ResolveContext } from "../systems/types";

export function buildResolveContext(run: RunState, wheel: ResolvedWheel | null): ResolveContext {
  if (wheel?.definition.wheelConfigId != null) {
    return {
      ...DEFAULT_RESOLVE_CONTEXT,
      exactLandWeights: true,
    };
  }

  const scaling = getScalingParams(run.floor);
  const mods = run.modifiers;
  let ctx: ResolveContext = {
    ...DEFAULT_RESOLVE_CONTEXT,
    negativeWeightMult: scaling.negativeWeightMult,
    positiveWeightMult: scaling.moneyInflationMult * (mods?.moneyGainMult ?? 1),
    rareWeightMult: mods?.rareWeightMult ?? 1,
    wheelNegativeBias: wheel?.definition.modifiers?.forceNegativeBias ?? 0,
  };

  if (run.perks.includes("lucky_streak")) {
    ctx = { ...ctx, positiveWeightMult: ctx.positiveWeightMult * 1.15 };
  }
  if (run.perks.includes("hot_table")) {
    ctx = {
      ...ctx,
      tagMults: { ...ctx.tagMults, rare: (ctx.tagMults.rare ?? 1) * 1.1 },
    };
  }

  const perkBoost = wheel?.definition.modifiers?.perkBoost ?? 0;
  if (perkBoost > 0) {
    ctx = { ...ctx, tagMults: { ...ctx.tagMults, rare: (ctx.tagMults.rare ?? 1) * (1 + perkBoost) } };
  }

  const stakesBoost = wheel?.definition.modifiers?.stakesBoost ?? 0;
  if (stakesBoost > 0) {
    ctx = {
      ...ctx,
      tagMults: {
        ...ctx.tagMults,
        stakes: (ctx.tagMults.stakes ?? 1) * (1 + stakesBoost) * scaling.stakesMult,
      },
    };
  }

  for (const debuffId of run.debuffs) {
    const d = DEBUFF_CATALOG[debuffId];
    if (d?.negativeWeightBonus != null) {
      ctx = { ...ctx, negativeWeightMult: ctx.negativeWeightMult * (1 + d.negativeWeightBonus) };
    }
  }

  ctx = mergeRelicContext(ctx, run);
  ctx = mergeDeckContext(ctx, run);
  return ctx;
}

export function useWheelModifiers(run: RunState | null, wheelIndex: number) {
  return useMemo(() => {
    if (run == null) {
      return { context: DEFAULT_RESOLVE_CONTEXT, slices: [], sliceCount: 6 };
    }
    const wheel = run.wheels[wheelIndex] ?? null;
    const context = buildResolveContext(run, wheel);
    return {
      context,
      slices: wheel?.slices ?? [],
      sliceCount: wheel?.slices.length ?? 6,
      physicsProfileId: wheel?.definition.physicsProfileId ?? "default",
    };
  }, [run, wheelIndex]);
}
