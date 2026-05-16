import { CARD_CATALOG } from "../data/cards";
import type { RunState } from "../schemas";
import type { ResolveContext } from "./types";
import { DEFAULT_RESOLVE_CONTEXT } from "./types";

const MAX_DECK_SIZE = 12;

export function addCard(run: RunState, cardId: string): RunState {
  if (run.deck.length >= MAX_DECK_SIZE) return run;
  if (run.deck.includes(cardId)) return run;
  return { ...run, deck: [...run.deck, cardId] };
}

export function removeCard(run: RunState): RunState {
  if (run.deck.length === 0) return run;
  return { ...run, deck: run.deck.slice(0, -1) };
}

export function upgradeDeck(run: RunState): RunState {
  if (!run.deck.includes("copper_chip")) {
    return addCard(run, "weighted_die");
  }
  if (!run.deck.includes("wide_wheel_card")) {
    return addCard(run, "wide_wheel_card");
  }
  return run;
}

export function getDeckModifiers(run: RunState): Partial<ResolveContext> {
  const ctx: Partial<ResolveContext> = {};
  let positiveMult = 1;
  for (const cardId of run.deck) {
    const card = CARD_CATALOG[cardId];
    if (card == null) continue;
    for (const effect of card.effects) {
      if (effect.type === "slice_weight_mult" && effect.tag === "positive") {
        positiveMult *= effect.mult;
      }
      if (effect.type === "expand_slices" && effect.toCount > run.sliceCapacity) {
        return { ...ctx, positiveWeightMult: positiveMult };
      }
    }
  }
  return { positiveWeightMult: positiveMult };
}

export function applyCardEffectsOnRunStart(run: RunState): RunState {
  let next = run;
  for (const cardId of run.deck) {
    const card = CARD_CATALOG[cardId];
    if (card == null) continue;
    for (const effect of card.effects) {
      if (effect.type === "flat_money") {
        next = { ...next, money: next.money + effect.amount };
      }
      if (effect.type === "money_shield") {
        next = { ...next, shields: (next.shields ?? 0) + effect.amount };
      }
      if (effect.type === "expand_slices" && effect.toCount > next.sliceCapacity) {
        next = { ...next, sliceCapacity: effect.toCount };
      }
    }
  }
  return next;
}

export function mergeDeckContext(base: ResolveContext, run: RunState): ResolveContext {
  const deck = getDeckModifiers(run);
  return {
    ...base,
    positiveWeightMult: base.positiveWeightMult * (deck.positiveWeightMult ?? 1),
  };
}

export function getDefaultDeckContext(): ResolveContext {
  return { ...DEFAULT_RESOLVE_CONTEXT };
}
