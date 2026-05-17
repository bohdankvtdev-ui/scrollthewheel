import { useMemo } from "react";
import type { RunState, ResolvedWheel } from "../schemas";
import { DEBUFF_CATALOG } from "../data/debuffs";
import { getScalingParams } from "../systems/InfiniteScaling";
import { mergeDeckContext } from "../systems/DeckSystem";
import { mergeRelicContext } from "../systems/RelicSystem";
import { getArchetypeForWheelIndex } from "../game/wheels";
import { getAdvancementPositiveWeightMult } from "../game/advancements";
import { applyPerkSpinEffects } from "../game/effects/applyPerkEffects";
import { getInfinitePressure } from "../game/effects/cycleAdvancement";
import { getWheelTypeAdjustments, mergeWheelTypeContext } from "../game/perks/wheelTypeModifiers";
import { DEFAULT_RESOLVE_CONTEXT, type ResolveContext } from "../systems/types";

export function buildResolveContext(
  run: RunState,
  wheel: ResolvedWheel | null,
  wheelIndex: number = run.wheelIndex
): ResolveContext {
  const scaling = getScalingParams(run.floor);
  const infinite = getInfinitePressure(run.floor);
  const mods = run.modifiers;
  const archetype = getArchetypeForWheelIndex(wheelIndex);
  let ctx: ResolveContext = {
    ...DEFAULT_RESOLVE_CONTEXT,
    negativeWeightMult: scaling.negativeWeightMult * infinite.negativeWeightMult,
    positiveWeightMult: scaling.moneyInflationMult * (mods?.moneyGainMult ?? 1),
    rareWeightMult: mods?.rareWeightMult ?? 1,
    wheelNegativeBias: wheel?.definition.modifiers?.forceNegativeBias ?? 0,
  };

  ctx = applyPerkSpinEffects(ctx, run.perks, archetype);
  const advMult = getAdvancementPositiveWeightMult(run.advancements);
  if (advMult > 1) {
    ctx = { ...ctx, positiveWeightMult: ctx.positiveWeightMult * advMult };
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

  const fxBias = run.runEffects?.negativeBiasBonus ?? 0;
  if (fxBias > 0) {
    ctx = {
      ...ctx,
      wheelNegativeBias: (ctx.wheelNegativeBias ?? 0) + fxBias,
      negativeWeightMult: ctx.negativeWeightMult * (1 + fxBias * 0.5),
    };
  }

  const typeAdj = getWheelTypeAdjustments(run, archetype, run.history.length);
  ctx = mergeWheelTypeContext(ctx, typeAdj);

  if (wheel?.definition.wheelConfigId != null) {
    ctx = { ...ctx, exactLandWeights: true };
  }

  return ctx;
}

export function useWheelModifiers(run: RunState | null, wheelIndex: number) {
  return useMemo(() => {
    if (run == null) {
      return { context: DEFAULT_RESOLVE_CONTEXT, slices: [], sliceCount: 6 };
    }
    const wheel = run.wheels[wheelIndex] ?? null;
    const context = buildResolveContext(run, wheel, wheelIndex);
    return {
      context,
      slices: wheel?.slices ?? [],
      sliceCount: wheel?.slices.length ?? 6,
      physicsProfileId: wheel?.definition.physicsProfileId ?? "default",
    };
  }, [run, wheelIndex]);
}
