import { PERK_CATALOG } from "../../data/perks";
import type { WheelOutcome } from "../wheels/types";
import { getArchetypeForWheelIndex } from "../wheels";
import {
  applyJokerEvent,
  jokerEventForBoss,
  jokerEventForSpin,
} from "../perks/jokerEngine";
import { getWheelTypeAdjustments } from "../perks/wheelTypeModifiers";
import { applyChipGain } from "../runState/chipsScoring";
import { winStreakChipBonus } from "../runState/runPressure";
import { shouldDebtShieldBlock } from "../runState/runEffects";
import type { RunState } from "../runState/types";
import type { SliceDefinition } from "../../schemas";
import { RunManager } from "../../systems/RunManager";

function adjustSliceForWheelType(
  slice: SliceDefinition,
  moneyGainMult: number,
  moneyLossMult: number
): SliceDefinition {
  const { payload } = slice;
  if (payload.moneyDelta != null) {
    const mult = payload.moneyDelta > 0 ? moneyGainMult : moneyLossMult;
    return {
      ...slice,
      payload: { ...payload, moneyDelta: Math.round(payload.moneyDelta * mult) },
    };
  }
  if (payload.bankPercent != null) {
    const mult = payload.bankPercent >= 0 ? moneyGainMult : moneyLossMult;
    return { ...slice, payload: { ...payload, bankPercent: payload.bankPercent * mult } };
  }
  return slice;
}

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
  if (archetype === "boss") {
    deltaChips += 3;
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
): RunState {
  const moneyBefore = run.money;
  const archetype = getArchetypeForWheelIndex(wheelIndex);
  const typeAdj = getWheelTypeAdjustments(run, archetype, run.history.length);
  const adjusted = adjustSliceForWheelType(slice, typeAdj.moneyGainMult, typeAdj.moneyLossMult);
  const outcome = buildWheelOutcome(run, adjusted, wheelIndex);

  if (shouldDebtShieldBlock(run, adjusted)) {
    return RunManager.applySliceResult(run, wheelIndex, adjusted, moneyBefore) as RunState;
  }
  let next = RunManager.applySliceResult(run, wheelIndex, adjusted, moneyBefore) as RunState;

  const moneyDelta = next.money - moneyBefore;

  let joker = applyJokerEvent(next, jokerEventForSpin(next, wheelIndex));
  next = joker.run;

  if (moneyDelta > 0) {
    const gain = applyJokerEvent(next, {
      type: "onGainMoney",
      amount: moneyDelta,
      wheelIndex,
    });
    next = gain.run;
    joker.chipsBonus += gain.chipsBonus;
  } else if (moneyDelta < 0) {
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

  return {
    ...next,
    pendingJokerOffers: outcome.perkOffers,
  };
}

export { buildWheelOutcome as previewWheelOutcome };
