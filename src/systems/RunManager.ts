import { DEBUFF_CATALOG } from "../data/debuffs";
import { PERK_CATALOG } from "../data/perks";
import { WHEEL_COUNT } from "../game";
import { BALATRO_ECONOMY } from "../game/balatroEconomy";
import { getBlindQuotaForRun, RUN_DEFAULTS } from "../game/loop";
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

export class RunManager {
  static createInitialRun(floor: number = RUN_DEFAULTS.startingFloor): RunState {
    let run: RunState = {
      runId: createRunId(),
      phase: "active",
      floor,
      wheelIndex: 0,
      money: RUN_DEFAULTS.startingMoney,
      chipsEarnedThisRun: 0,
      modifiers: {
        moneyGainMult: 1,
        moneyLossMult: 1,
        rareWeightMult: 1,
        chipGainMult: 1,
      },
      pendingJokerOffers: [],
      deck: [],
      perks: [],
      shields: 0,
      debuffs: [],
      relics: [],
      sliceCapacity: RUN_DEFAULTS.startingSliceCapacity,
      blindQuota: getBlindQuotaForRun(floor, []),
      floorsCleared: Math.max(0, floor - 1),
      history: [],
      wheels: [],
    };
    run = applyCardEffectsOnRunStart(run);
    run = syncRunWheels({ ...run, wheels: buildFloorWheels(run) });
    return run;
  }

  static canSpin(run: RunState | null, wheelIndex: number): boolean {
    if (run == null || run.phase !== "active") return false;
    if (wheelIndex !== run.wheelIndex) return false;
    if (run.money < RUN_DEFAULTS.bankruptcyThreshold) return false;
    return run.wheels[wheelIndex] != null;
  }

  static applySliceResult(run: RunState, wheelIndex: number, slice: SliceDefinition): RunState {
    let next = { ...run };
    const { payload, kind } = slice;

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

    next = {
      ...next,
      history: [
        ...next.history.slice(-RUN_DEFAULTS.historyMaxEvents),
        { wheelIndex, sliceId: slice.id, floor: next.floor, ts: Date.now() },
      ],
    };

    return RunManager.checkRunEnd(next);
  }

  static advanceWheel(run: RunState): RunState {
    if (run.phase !== "active") return run;
    const nextIndex = run.wheelIndex + 1;

    if (nextIndex >= WHEEL_COUNT) {
      return RunManager.checkBlindClear(run);
    }

    return RunManager.checkRunEnd({ ...run, wheelIndex: nextIndex });
  }

  static applyFloorInterest(run: RunState): RunState {
    const interest = Math.min(
      BALATRO_ECONOMY.interestCap,
      Math.floor(run.money / BALATRO_ECONOMY.interestDivisor)
    );
    if (interest <= 0) return run;
    return { ...run, money: run.money + interest };
  }

  static checkBlindClear(run: RunState): RunState {
    if (run.money < run.blindQuota) {
      return { ...run, phase: "lost_blind" };
    }
    const withInterest = RunManager.applyFloorInterest(run);
    return { ...withInterest, phase: "won" };
  }

  static enterInfiniteFloor(run: RunState): RunState {
    const nextFloor = run.floor + 1;
    let next: RunState = {
      ...run,
      floor: nextFloor,
      wheelIndex: 0,
      phase: "active",
      floorsCleared: run.floorsCleared + 1,
    };
    next = applyScalingToRun(next, nextFloor);
    next = syncRunWheels({ ...next, wheels: buildFloorWheels(next) });
    return next;
  }

  static checkRunEnd(run: RunState): RunState {
    if (run.money < RUN_DEFAULTS.bankruptcyThreshold) {
      return { ...run, phase: "lost_money" };
    }
    return run;
  }

  static onBossClearedContinue(run: RunState): RunState {
    if (run.phase === "won") {
      return RunManager.enterInfiniteFloor(run);
    }
    return run;
  }
}
