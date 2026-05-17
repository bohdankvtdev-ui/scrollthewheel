import { DEBUFF_CATALOG } from "../data/debuffs";

import { PERK_CATALOG } from "../data/perks";

import { WHEEL_COUNT } from "../game";

import { BALATRO_ECONOMY } from "../game/balatroEconomy";

import { getBlindQuotaForRun, getCycleBonusChips, RUN_DEFAULTS } from "../game/loop";

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
  applyRunPressureAfterSpin,
  canPlayAtZeroBank,
  isPressureRunOver,
} from "../game/runState/runPressure";
import { applyChipForgeToModifiers } from "../game/shop/chipForge";

import { applyJokerEvent } from "../game/perks/jokerEngine";



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

      debuffs: [],

      relics: [],

      sliceCapacity: RUN_DEFAULTS.startingSliceCapacity,

      blindQuota: getBlindQuotaForRun(floor, []),

      floorsCleared: Math.max(0, floor - 1),

      history: [],

      wheels: [],

      pressure: 0,

      winStreak: 0,

      lossStreak: 0,

      chipForge: {},

    };

    run = applyChipForgeToModifiers(run);

    run = applyCardEffectsOnRunStart(run);

    run = syncRunWheels({ ...run, wheels: buildFloorWheels(run) });

    return run;

  }



  static canSpin(run: RunState | null, wheelIndex: number): boolean {

    if (run == null || run.phase !== "active") return false;

    if (wheelIndex !== run.wheelIndex) return false;

    if (isPressureRunOver(run)) return false;

    if (run.money <= RUN_DEFAULTS.bankruptcyThreshold && !canPlayAtZeroBank(run)) {
      return false;
    }

    return run.wheels[wheelIndex] != null;

  }



  static applySliceResult(

    run: RunState,

    wheelIndex: number,

    slice: SliceDefinition,

    moneyBefore?: number

  ): RunState {

    const priorMoney = moneyBefore ?? run.money;

    let next = { ...run };

    const { payload, kind } = slice;



    if (shouldDebtShieldBlock(next, slice)) {
      const shielded = markDebtShieldUsed(next);
      const afterPressure = applyRunPressureAfterSpin(
        shielded,
        slice,
        priorMoney,
        shielded.money,
        true
      );
      return RunManager.checkRunEnd(afterPressure, slice, priorMoney);
    }



    if (payload.wipeBank || kind === "bank_wipe") {

      next = applyWipeBank(next);

    } else if (payload.bankPercent != null) {

      next = applyBankPercent(next, payload.bankPercent);

    } else if (payload.moneyDelta != null) {

      next = applyMoneyDelta(next, payload.moneyDelta);

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



    const afterPressure = applyRunPressureAfterSpin(next, slice, priorMoney, next.money, false);

    return RunManager.checkRunEnd(afterPressure, slice, priorMoney);

  }



  static advanceWheel(run: RunState): RunState {

    if (run.phase !== "active") return run;

    const nextIndex = run.wheelIndex + 1;



    if (nextIndex >= WHEEL_COUNT) {

      return RunManager.completeCycle(run);

    }



    let next = tickRunEffectsOnWheelAdvance({ ...run, wheelIndex: nextIndex });

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



  /** After wheel 9 — survive boss, optional blind bonus, advance cycle */

  static completeCycle(run: RunState): RunState {

    let next = RunManager.applyFloorInterest(run);

    const blindBonus =

      next.money >= next.blindQuota ? getCycleBonusChips(next.floor) : 0;

    if (blindBonus > 0) {

      next = applyChipGain(next as RunState & { chipsEarnedThisRun: number }, blindBonus) as RunState;

    }



    const cycleEnd = applyJokerEvent(next, {

      type: "onFloorEnd",

      floor: next.floor,

      cleared: true,

    });

    next = applyChipGain(

      cycleEnd.run as RunState & { chipsEarnedThisRun: number },

      cycleEnd.chipsBonus

    ) as RunState;



    return { ...next, phase: "won" };

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
      pressure: Math.max(0, (run.pressure ?? 0) - 1),
      winStreak: 0,
      lossStreak: 0,
    };

    const stipend = getAdvancementCycleStipend(next.advancements);
    if (stipend > 0) {
      next = { ...next, money: next.money + stipend };
    }

    next = applyScalingToRun(next, nextFloor);

    next = syncRunWheels({ ...next, wheels: buildFloorWheels(next) });

    return next;

  }



  static checkRunEnd(

    run: RunState,

    _slice?: SliceDefinition,

    _moneyBefore?: number

  ): RunState {

    if (isPressureRunOver(run)) {
      return { ...run, phase: "lost_money" };
    }

    if (run.money > RUN_DEFAULTS.bankruptcyThreshold) {
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


