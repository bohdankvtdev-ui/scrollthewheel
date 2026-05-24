import type { RunState } from "../runState/types";
import { getArchetypeForWheelIndex } from "../wheels";
import { floorClearChipBase } from "../shop/chipGrants";
import { countPerkCopies } from "./perkStacks";
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
  const next = run;
  let chipsBonus = 0;
  const moneyDeltaBonus = 0;

  if (event.type === "onGainMoney" && event.amount > 0) {
    chipsBonus += countPerkCopies(next.perks, "chip_drip");
    if (countPerkCopies(next.perks, "streak_spark") > 0 && (next.winStreak ?? 0) >= 2) {
      chipsBonus += countPerkCopies(next.perks, "streak_spark");
    }
  }

  if (event.type === "onFloorEnd" && event.cleared) {
    chipsBonus += floorClearChipBase(event.floor);
    chipsBonus += countPerkCopies(next.perks, "ante_insurance") * 4;
    const deepStacks = countPerkCopies(next.perks, "deep_pockets");
    if (deepStacks > 0) {
      chipsBonus += deepStacks * (4 + Math.max(0, event.floor));
    }
    if (countPerkCopies(next.perks, "cycle_momentum") > 0 && event.floor > 0 && event.floor % 5 === 0) {
      chipsBonus += countPerkCopies(next.perks, "cycle_momentum") * 2;
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
