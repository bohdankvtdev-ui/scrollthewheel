import type { RunModifiers, RunState } from "../runState/types";
import { getArchetypeForWheelIndex } from "../wheels";
import type { JokerEvent } from "./joker.types";

export type JokerEngineResult = {
  run: RunState;
  chipsBonus: number;
  moneyDeltaBonus: number;
};

function withModifiers(run: RunState, patch: Partial<RunModifiers>): RunState {
  return {
    ...run,
    modifiers: { ...run.modifiers, ...patch },
  };
}

/**
 * Fire joker triggers after a wheel event. Returns patched run + extra deltas.
 * Stacking: most jokers are unique (owned once); effects sum where applicable.
 */
export function applyJokerEvent(run: RunState, event: JokerEvent): JokerEngineResult {
  let next = run;
  let chipsBonus = 0;
  let moneyDeltaBonus = 0;

  const owns = (id: string) => next.perks.includes(id);

  if (event.type === "onSpin") {
    if (owns("hot_table")) {
      next = withModifiers(next, { rareWeightMult: (next.modifiers.rareWeightMult ?? 1) * 1.1 });
    }
    if (event.archetype === "boss" && owns("lucky_streak")) {
      chipsBonus += 2;
    }
  }

  if (event.type === "onGainMoney" && event.amount > 0) {
    if (owns("double_down") && next.doubleDownPending) {
      moneyDeltaBonus += event.amount;
    }
    if (owns("gold_rush")) {
      moneyDeltaBonus += Math.floor(event.amount * 0.25);
    }
    if (owns("vip_roller")) {
      moneyDeltaBonus += Math.floor(event.amount * 0.2);
    }
    if (owns("high_roller")) {
      moneyDeltaBonus += Math.floor(event.amount * 0.15);
    }
    const fc = Math.max(0, next.floorsCleared ?? 0);
    if (owns("compounder")) {
      moneyDeltaBonus += Math.floor(event.amount * fc * 0.05);
    }
    if (owns("lucky_streak")) {
      chipsBonus += 1;
    }
  }

  if (event.type === "onLoseMoney" && event.amount < 0) {
    if (owns("lucky_streak")) {
      chipsBonus += 1;
    }
  }

  if (event.type === "onBoss") {
    chipsBonus += 8;
    if (owns("iron_reserve") || owns("safe_harbor")) {
      chipsBonus += 3;
    }
  }

  if (event.type === "onFloorEnd" && event.cleared) {
    chipsBonus += 15 + event.floor * 5;
    if (owns("compounder")) {
      chipsBonus += Math.floor(event.floor * 2);
    }
  }

  return { run: next, chipsBonus, moneyDeltaBonus };
}

export function jokerEventForSpin(run: RunState, wheelIndex: number): JokerEvent {
  return {
    type: "onSpin",
    wheelIndex,
    archetype: getArchetypeForWheelIndex(wheelIndex),
  };
}

export function jokerEventForBoss(wheelIndex: number): JokerEvent {
  return { type: "onBoss", wheelIndex };
}
