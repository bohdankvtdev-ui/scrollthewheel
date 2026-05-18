import { PERK_CATALOG } from "../../data/perks";
import type { WheelOutcome } from "../wheels/types";
import { getArchetypeForWheelIndex } from "../wheels";
import {
  applyJokerEvent,
  jokerEventForBoss,
  jokerEventForSpin,
} from "../perks/jokerEngine";
import { applyChipGain } from "../runState/chipsScoring";
import { winStreakChipBonus, updatePeakMoney } from "../runState/runStreaks";
import { applyMoneyDelta } from "../../systems/PerkSystem";
import { shouldDebtShieldBlock } from "../runState/runEffects";
import type { RunState } from "../runState/types";
import type { SliceDefinition } from "../../schemas";
import { RunManager } from "../../systems/RunManager";
import {
  adjustSliceForRun,
  computeSliceMoneyDelta,
} from "../../utils/sliceMoneyDisplay";

export type WheelResolveResult = {
  run: RunState;
  moneyReveal?: { before: number; delta: number };
};

export function buildWheelOutcome(
  run: RunState,
  slice: SliceDefinition,
  wheelIndex: number
): WheelOutcome {
  const { payload, kind } = slice;
  let deltaMoney = 0;
  const perkOffers: string[] = [];
  let debuffApplied: string | null = null;
  let relicGranted: string | null = null;
  let deltaChips = 0;

  if (payload.wipeBank || kind === "bank_wipe") {
    deltaMoney = -run.money;
  } else if (payload.bankPercent != null) {
    deltaMoney =
      payload.bankPercent >= 0
        ? Math.floor(run.money * payload.bankPercent)
        : -Math.floor(run.money * Math.abs(payload.bankPercent));
  } else if (payload.moneyDelta != null) {
    deltaMoney = payload.moneyDelta;
  }

  if (payload.perkId != null && PERK_CATALOG[payload.perkId] != null) {
    if (!run.perks.includes(payload.perkId)) {
      perkOffers.push(payload.perkId);
    }
  }

  if (payload.debuffId != null && !run.debuffs.includes(payload.debuffId)) {
    debuffApplied = payload.debuffId;
  }

  if (payload.relicId != null) {
    relicGranted = payload.relicId;
  }

  const archetype = getArchetypeForWheelIndex(wheelIndex);
  if (deltaMoney > 0) {
    deltaChips += Math.max(1, Math.floor(deltaMoney / 80));
  }
  if (archetype === "joker_offer" && perkOffers.length > 0) {
    deltaChips += 4;
  }
  if (archetype === "lucky" && deltaMoney > 200) {
    deltaChips += 6;
  }
  if (archetype === "boss" && deltaMoney > 0) {
    deltaChips += 1;
  }
  if (archetype === "chaos") {
    deltaChips += 2;
  }
  if (archetype === "money" && deltaMoney > 0) {
    deltaChips += 1;
  }

  return {
    deltaMoney,
    deltaChips,
    perkOffers,
    debuffApplied,
    relicGranted,
    label: slice.label,
    sliceId: slice.id,
    sliceKind: kind,
  };
}

export function resolveAndApplyWheel(
  run: RunState,
  wheelIndex: number,
  slice: SliceDefinition
): WheelResolveResult {
  const moneyBefore = run.money;
  const adjusted = adjustSliceForRun(run, slice, wheelIndex);
  const outcome = buildWheelOutcome(run, adjusted, wheelIndex);
  const projectedDelta = computeSliceMoneyDelta(run, slice, wheelIndex);
  const deferMoneyFx = projectedDelta !== 0;

  if (shouldDebtShieldBlock(run, adjusted)) {
    return {
      run: RunManager.applySliceResult(run, wheelIndex, adjusted, moneyBefore) as RunState,
    };
  }

  let next = RunManager.applySliceResult(
    run,
    wheelIndex,
    adjusted,
    moneyBefore,
    deferMoneyFx
      ? { skipMoney: true, streakMoneyAfter: moneyBefore + projectedDelta }
      : undefined
  ) as RunState;

  const moneyDelta = deferMoneyFx ? projectedDelta : next.money - moneyBefore;
  const archetype = getArchetypeForWheelIndex(wheelIndex);

  let joker = applyJokerEvent(next, jokerEventForSpin(next, wheelIndex));
  next = joker.run;

  if (moneyDelta > 0 && !deferMoneyFx) {
    const gain = applyJokerEvent(next, {
      type: "onGainMoney",
      amount: moneyDelta,
      wheelIndex,
    });
    next = gain.run;
    joker.chipsBonus += gain.chipsBonus;
  } else if (moneyDelta < 0 && !deferMoneyFx) {
    const loss = applyJokerEvent(next, {
      type: "onLoseMoney",
      amount: moneyDelta,
      wheelIndex,
    });
    next = loss.run;
    joker.chipsBonus += loss.chipsBonus;
  }

  if (archetype === "boss") {
    const boss = applyJokerEvent(next, jokerEventForBoss(wheelIndex));
    next = boss.run;
    joker.chipsBonus += boss.chipsBonus;
  }

  const streakBonus = winStreakChipBonus(next.winStreak ?? 0);
  const chipTotal = outcome.deltaChips + joker.chipsBonus + streakBonus;
  next = applyChipGain(next, chipTotal);

  const result: WheelResolveResult = {
    run: {
      ...next,
      pendingJokerOffers: outcome.perkOffers,
    },
  };

  if (deferMoneyFx) {
    result.moneyReveal = { before: moneyBefore, delta: projectedDelta };
    const projectedBank = moneyBefore + projectedDelta;
    if (projectedBank > 0 && result.run.phase === "lost_money") {
      result.run = { ...result.run, phase: "active" };
    }
  }

  return result;
}

export function commitDeferredMoney(run: RunState, delta: number, wheelIndex: number): RunState {
  if (delta === 0) return run;

  let next = applyMoneyDelta(run, delta) as RunState;

  if (delta > 0) {
    const gain = applyJokerEvent(next, {
      type: "onGainMoney",
      amount: delta,
      wheelIndex,
    });
    next = gain.run;
    next = applyChipGain(next, gain.chipsBonus);
    return updatePeakMoney(next);
  }

  const loss = applyJokerEvent(next, {
    type: "onLoseMoney",
    amount: delta,
    wheelIndex,
  });
  next = loss.run;
  next = applyChipGain(next, loss.chipsBonus);
  return RunManager.checkRunEnd(next) as RunState;
}

export { buildWheelOutcome as previewWheelOutcome };
