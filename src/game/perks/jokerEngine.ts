import type { RunState } from "../runState/types";
import { getArchetypeForWheelIndex } from "../wheels";
import type { JokerEvent } from "./joker.types";

export type JokerEngineResult = {
  run: RunState;
  chipsBonus: number;
  moneyDeltaBonus: number;
};

/**
 * Joker triggers after wheel events.
 * Money multipliers live in PerkSystem.applyMoneyDelta — only chip/meta bonuses here.
 */
export function applyJokerEvent(run: RunState, event: JokerEvent): JokerEngineResult {
  let next = run;
  let chipsBonus = 0;
  const moneyDeltaBonus = 0;

  const owns = (id: string) => next.perks.includes(id);

  if (event.type === "onSpin") {
    if (event.archetype === "boss" && owns("lucky_streak")) {
      chipsBonus += 2;
    }
  }

  if (event.type === "onGainMoney" && event.amount > 0) {
    if (owns("lucky_streak")) {
      chipsBonus += 2;
    }
    if (owns("gold_rush")) {
      chipsBonus += 1;
    }
    if (owns("chip_drip")) {
      chipsBonus += 1;
    }
    if (owns("streak_spark") && (next.winStreak ?? 0) >= 2) {
      chipsBonus += 1;
    }
  }

  if (event.type === "onLoseMoney" && event.amount < 0) {
    if (owns("lucky_streak")) {
      chipsBonus += 1;
    }
  }

  if (event.type === "onBoss") {
    chipsBonus += 1;
  }

  if (event.type === "onFloorEnd" && event.cleared) {
    chipsBonus += 8 + event.floor * 3;
    if (owns("compounder")) {
      chipsBonus += Math.floor(event.floor * 2);
    }
    if (owns("ante_insurance")) {
      chipsBonus += 4;
    }
    if (owns("deep_pockets")) {
      chipsBonus += 4 + Math.max(0, event.floor);
    }
    if (owns("cycle_momentum") && event.floor > 0 && event.floor % 5 === 0) {
      chipsBonus += 2;
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
