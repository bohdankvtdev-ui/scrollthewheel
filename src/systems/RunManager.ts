import { DEBUFF_CATALOG } from "../data/debuffs";

import { PERK_CATALOG } from "../data/perks";

import { WHEEL_COUNT } from "../game";

import { BALATRO_ECONOMY } from "../game/balatroEconomy";

import { RUN_DEFAULTS } from "../game/loop";

import {

  applyRunEffect,

  isSliceNegative,

  markDebtShieldUsed,

  resetCycleRunEffects,

  shouldDebtShieldBlock,

  tickRunEffectsOnWheelAdvance,

} from "../game/runState/runEffects";

import type { RunState, SliceDefinition } from "../schemas";

import { createRunId } from "../utils/ids";

import { addCard, applyCardEffectsOnRunStart, removeCard, upgradeDeck } from "./DeckSystem";

import { applyScalingToRun } from "./InfiniteScaling";

import {

  addSliceSlots,

  applyBankPercent,

  applyMoneyDelta,

  applyPerkAcquisition,

  applyWipeBank,

} from "./PerkSystem";

import { addRelic } from "./RelicSystem";

import { buildFloorWheels, syncRunWheels } from "./WheelSystem";

import {
  getAdvancementCycleStipend,
  getAdvancementInterestMult,
} from "../game/advancements";
import { applyChipGain } from "../game/runState/chipsScoring";
import {
  applyRunStreakAfterSpin,
  updatePeakMoney,
} from "../game/runState/runStreaks";
import { applyChipForgeToModifiers } from "../game/shop/chipForge";

import { getCycleRewardPackage } from "../game/cycle/cycleProgression";
import {
  applyPostBuilderSliceFloor,
  sliceCapacityForNextCycle,
} from "../game/wheels/sliceCapacityBonus";
import { applyJokerEvent } from "../game/perks/jokerEngine";

const FINAL_WHEEL_INDEX = 8;

function applyClutchCashIfNeeded(run: RunState, wheelIndex: number): RunState {
  if (wheelIndex !== FINAL_WHEEL_INDEX) return run;
  if (!run.perks.includes("clutch_cash")) return run;
  const paidCycle = run.runEffects?.clutchCashPaidCycle ?? 0;
  if (paidCycle >= run.floor) return run;
  return {
    ...run,
    money: run.money + 50,
    runEffects: { ...run.runEffects, clutchCashPaidCycle: run.floor },
  };
}

export class RunManager {

  static createInitialRun(floor: number = RUN_DEFAULTS.startingFloor): RunState {

    let run: RunState = {

      runId: createRunId(),

      phase: "active",

      floor,

      wheelIndex: 0,

      money: RUN_DEFAULTS.startingMoney,

      chipsEarnedThisRun: RUN_DEFAULTS.startingChips,

      modifiers: {

        moneyGainMult: 1,

        moneyLossMult: 1,

        rareWeightMult: 1,

        chipGainMult: 1,

      },

      runEffects: {},

      pendingJokerOffers: [],

      deck: [],

      perks: [],

      advancements: [],

      shields: 0,

      shieldPerks: [],

      debuffs: [],

      relics: [],

      sliceCapacity: RUN_DEFAULTS.startingSliceCapacity,

      floorsCleared: Math.max(0, floor - 1),

      history: [],

      wheels: [],

      winStreak: 0,

      peakMoney: RUN_DEFAULTS.startingMoney,

      chipForge: {},

      inventory: { wedgeEraser: 0 },

      banishedPrizes: {},

    };

    run = applyChipForgeToModifiers(run);

    run = applyCardEffectsOnRunStart(run);

    run = syncRunWheels({ ...run, wheels: buildFloorWheels(run) });

    return run;

  }



  static canSpin(run: RunState | null, wheelIndex: number): boolean {

    if (run == null || run.phase !== "active") return false;

    if (wheelIndex !== run.wheelIndex) return false;

    if (run.money <= RUN_DEFAULTS.bankruptcyThreshold && run.history.length > 0) {
      return false;
    }

    return run.wheels[wheelIndex] != null;

  }



  static applySliceResult(

    run: RunState,

    wheelIndex: number,

    slice: SliceDefinition,

    moneyBefore?: number,

    options?: { skipMoney?: boolean; streakMoneyAfter?: number }

  ): RunState {

    const priorMoney = moneyBefore ?? run.money;

    let next = { ...run };

    const { payload, kind } = slice;



    if (shouldDebtShieldBlock(next, slice)) {
      const shielded = markDebtShieldUsed(next);
      const afterStreak = updatePeakMoney(
        applyRunStreakAfterSpin(shielded, slice, priorMoney, shielded.money, true)
      );
      return RunManager.checkRunEnd(afterStreak, slice, priorMoney);
    }



    if (!options?.skipMoney) {
      if (payload.wipeBank || kind === "bank_wipe") {
        next = applyWipeBank(next);
      } else if (payload.bankPercent != null) {
        next = applyBankPercent(next, payload.bankPercent);
      } else if (payload.moneyDelta != null) {
        next = applyMoneyDelta(next, payload.moneyDelta);
      }
    }



    if (payload.perkId != null && PERK_CATALOG[payload.perkId] != null) {

      next = applyPerkAcquisition(next, payload.perkId);

    }



    if (payload.debuffId != null && DEBUFF_CATALOG[payload.debuffId] != null && !next.debuffs.includes(payload.debuffId)) {

      next = { ...next, debuffs: [...next.debuffs, payload.debuffId] };

    }



    if (payload.relicId != null) {

      next = addRelic(next, payload.relicId);

    }



    if (payload.cardId != null) {

      next = addCard(next, payload.cardId);

    }



    if (kind === "deck_remove") next = removeCard(next);

    if (kind === "deck_upgrade") next = upgradeDeck(next);



    if (payload.sliceDelta != null && payload.sliceDelta > 0) {

      const slicePerk = payload.perkId;

      if (slicePerk !== "extra_slice" && slicePerk !== "slice_expander") {

        next = addSliceSlots(next, payload.sliceDelta);

      }

    } else if (payload.expandSlicesTo != null && payload.expandSlicesTo > next.sliceCapacity) {

      next = addSliceSlots(next, 1);

    }



    next = applyRunEffect(next, slice, wheelIndex);



    next = {

      ...next,

      history: [

        ...next.history.slice(-RUN_DEFAULTS.historyMaxEvents),

        { wheelIndex, sliceId: slice.id, floor: next.floor, ts: Date.now() },

      ],

    };



    const streakAfter = options?.streakMoneyAfter ?? next.money;
    let afterStreak = applyRunStreakAfterSpin(next, slice, priorMoney, streakAfter, false);
    if (!options?.skipMoney) {
      afterStreak = updatePeakMoney(afterStreak);
    } else if (options.streakMoneyAfter != null) {
      afterStreak = {
        ...afterStreak,
        peakMoney: Math.max(afterStreak.peakMoney ?? 0, options.streakMoneyAfter),
      };
    }

    const bankForEnd =
      options?.skipMoney && options.streakMoneyAfter != null
        ? options.streakMoneyAfter
        : undefined;

    return RunManager.checkRunEnd(afterStreak, slice, priorMoney, bankForEnd);

  }



  static advanceWheel(run: RunState): RunState {

    if (run.phase !== "active") return run;

    const nextIndex = run.wheelIndex + 1;



    if (nextIndex >= WHEEL_COUNT) {

      return RunManager.completeCycle(run);

    }



    let next = tickRunEffectsOnWheelAdvance({ ...run, wheelIndex: nextIndex });
    next = applyPostBuilderSliceFloor(next);
    next = applyClutchCashIfNeeded(next, nextIndex);

    return RunManager.checkRunEnd(next);

  }



  static applyFloorInterest(run: RunState): RunState {
    const base = Math.min(
      BALATRO_ECONOMY.interestCap,
      Math.floor(run.money / BALATRO_ECONOMY.interestDivisor)
    );
    const interest = Math.floor(base * getAdvancementInterestMult(run.advancements));
    if (interest <= 0) return run;
    return { ...run, money: run.money + interest };
  }



  /** After wheel 9 — survive boss, advance cycle */

  static completeCycle(run: RunState): RunState {

    let next = updatePeakMoney(RunManager.applyFloorInterest(run));
    const reward = getCycleRewardPackage(next);
    next = { ...next, money: next.money + reward.money };

    const cycleEnd = applyJokerEvent(next, {
      type: "onFloorEnd",
      floor: next.floor,
      cleared: true,
    });

    next = applyChipGain(
      cycleEnd.run as RunState & { chipsEarnedThisRun: number },
      cycleEnd.chipsBonus + reward.chips
    ) as RunState;

    return {
      ...next,
      phase: "won",
      lastCycleReward: { cycle: reward.cycle, chips: reward.chips, money: reward.money },
      runEffects: { ...next.runEffects, pitStopPending: true },
    };

  }



  static checkBlindClear(run: RunState): RunState {

    return RunManager.completeCycle(run);

  }



  static enterInfiniteFloor(run: RunState): RunState {

    const nextFloor = run.floor + 1;

    let next: RunState = {
      ...run,
      floor: nextFloor,
      wheelIndex: 0,
      phase: "active",
      floorsCleared: run.floorsCleared + 1,
      runEffects: resetCycleRunEffects(run),
      winStreak: 0,
    };

    const stipend = getAdvancementCycleStipend(next.advancements);
    if (stipend > 0) {
      next = { ...next, money: next.money + stipend };
    }

    next = applyScalingToRun(next, nextFloor);

    next = {
      ...next,
      sliceCapacity: sliceCapacityForNextCycle(next),
      pendingWheelRebuild: true,
    };

    next = syncRunWheels({ ...next, wheels: buildFloorWheels(next) });

    return next;

  }



  static checkRunEnd(

    run: RunState,

    _slice?: SliceDefinition,

    _moneyBefore?: number,

    /** Use when cash is applied after animation (bank still 0 in `run.money`). */
    bankBalance?: number

  ): RunState {

    const bank = bankBalance ?? run.money;

    if (bank > RUN_DEFAULTS.bankruptcyThreshold) {
      if (run.phase === "lost_money") {
        return { ...run, phase: "active" };
      }
      return run;
    }

    if (run.history.length === 0) {
      return run;
    }

    if (run.relics.includes("iron_grit") && !run.runEffects?.ironGritUsed) {

      return {

        ...run,

        money: 1,

        runEffects: { ...run.runEffects, ironGritUsed: true },

      };

    }



    return { ...run, phase: "lost_money" };

  }



  static onBossClearedContinue(run: RunState): RunState {

    if (run.phase === "won") {

      return RunManager.enterInfiniteFloor(run);

    }

    return run;

  }

}


