import { RELIC_CATALOG } from "../data/relics";
import type { RunState } from "../schemas";
import type { ResolveContext } from "./types";

export function addRelic(run: RunState, relicId: string): RunState {
  const relic = RELIC_CATALOG[relicId];
  if (relic == null) return run;
  if (!relic.stackable && run.relics.includes(relicId)) return run;
  return { ...run, relics: [...run.relics, relicId] };
}

export function getRelicWeightModifiers(run: RunState): Record<string, number> {
  const tagMults: Record<string, number> = {};
  for (const relicId of run.relics) {
    const relic = RELIC_CATALOG[relicId];
    if (relic?.weightTagMult == null) continue;
    for (const [tag, mult] of Object.entries(relic.weightTagMult)) {
      tagMults[tag] = (tagMults[tag] ?? 1) * (mult ?? 1);
    }
  }
  return tagMults;
}

export function getRelicMoneyMult(run: RunState): number {
  let mult = 1;
  for (const relicId of run.relics) {
    const relic = RELIC_CATALOG[relicId];
    if (relic?.moneyMult != null) mult *= relic.moneyMult;
  }
  return mult;
}

export function mergeRelicContext(base: ResolveContext, run: RunState): ResolveContext {
  return {
    ...base,
    tagMults: { ...base.tagMults, ...getRelicWeightModifiers(run) },
    positiveWeightMult: base.positiveWeightMult * getRelicMoneyMult(run),
  };
}

export function onRunStart(run: RunState): RunState {
  return run;
}
