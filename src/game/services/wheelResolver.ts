import { PERK_CATALOG } from "../../data/perks";
import { DEBUFF_CATALOG } from "../../data/debuffs";
import { RUN_DEFAULTS } from "../loop";
import type { WheelOutcome } from "../wheels/types";
import { getArchetypeForWheelIndex } from "../wheels";
import {
  applyJokerEvent,
  jokerEventForBoss,
  jokerEventForSpin,
} from "../perks/jokerEngine";
import { applyChipGain } from "../runState/chipsScoring";
import type { RunState } from "../runState/types";
import type { SliceDefinition } from "../../schemas";
import { RunManager } from "../../systems/RunManager";
import {
  addSliceSlots,
  applyBankPercent,
  applyMoneyDelta,
  applyPerkAcquisition,
  applyWipeBank,
} from "../../systems/PerkSystem";
import { addRelic } from "../../systems/RelicSystem";
import { addCard, removeCard, upgradeDeck } from "../../systems/DeckSystem";

/** Build a structured outcome from a resolved slice (before application). */
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
  if (archetype === "joker_offer" && perkOffers.length > 0) {
    deltaChips += 3;
  }
  if (archetype === "jackpot" && deltaMoney > 200) {
    deltaChips += 5;
  }
  if (archetype === "boss") {
    deltaChips += 2;
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

function applyOutcomeCore(run: RunState, wheelIndex: number, slice: SliceDefinition): RunState {
  let next: RunState = { ...run };
  const { payload, kind } = slice;

  if (payload.wipeBank || kind === "bank_wipe") {
    next = applyWipeBank(next) as RunState;
  } else if (payload.bankPercent != null) {
    next = applyBankPercent(next, payload.bankPercent) as RunState;
  } else if (payload.moneyDelta != null) {
    next = applyMoneyDelta(next, payload.moneyDelta) as RunState;
  }

  if (payload.perkId != null && PERK_CATALOG[payload.perkId] != null) {
    next = applyPerkAcquisition(next, payload.perkId) as RunState;
  }

  if (payload.debuffId != null && DEBUFF_CATALOG[payload.debuffId] != null && !next.debuffs.includes(payload.debuffId)) {
    next = { ...next, debuffs: [...next.debuffs, payload.debuffId] };
  }

  if (payload.relicId != null) {
    next = addRelic(next, payload.relicId) as RunState;
  }

  if (payload.cardId != null) {
    next = addCard(next, payload.cardId) as RunState;
  }

  if (kind === "deck_remove") next = removeCard(next) as RunState;
  if (kind === "deck_upgrade") next = upgradeDeck(next) as RunState;

  if (payload.sliceDelta != null && payload.sliceDelta > 0) {
    const slicePerk = payload.perkId;
    if (slicePerk !== "extra_slice" && slicePerk !== "slice_expander") {
      next = addSliceSlots(next, payload.sliceDelta) as RunState;
    }
  } else if (payload.expandSlicesTo != null && payload.expandSlicesTo > next.sliceCapacity) {
    next = addSliceSlots(next, 1) as RunState;
  }

  next = {
    ...next,
    history: [
      ...next.history.slice(-RUN_DEFAULTS.historyMaxEvents),
      { wheelIndex, sliceId: slice.id, floor: next.floor, ts: Date.now() },
    ],
  };

  return RunManager.checkRunEnd(next) as RunState;
}

/**
 * Full wheel resolution: apply slice → joker triggers → chip gains → boss hooks.
 */
export function resolveAndApplyWheel(
  run: RunState,
  wheelIndex: number,
  slice: SliceDefinition
): RunState {
  const moneyBefore = run.money;
  const outcome = buildWheelOutcome(run, slice, wheelIndex);

  let next = applyOutcomeCore(run, wheelIndex, slice);

  const moneyAfter = next.money;
  const moneyDelta = moneyAfter - moneyBefore;

  let joker = applyJokerEvent(next, jokerEventForSpin(next, wheelIndex));
  next = joker.run;

  if (moneyDelta > 0) {
    const gain = applyJokerEvent(next, {
      type: "onGainMoney",
      amount: moneyDelta,
      wheelIndex,
    });
    next = gain.run;
    if (gain.moneyDeltaBonus > 0) {
      next = applyMoneyDelta(next, gain.moneyDeltaBonus) as RunState;
    }
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

  const archetype = getArchetypeForWheelIndex(wheelIndex);
  if (archetype === "boss") {
    const boss = applyJokerEvent(next, jokerEventForBoss(wheelIndex));
    next = boss.run;
    joker.chipsBonus += boss.chipsBonus;
  }

  const chipTotal = outcome.deltaChips + joker.chipsBonus;
  next = applyChipGain(next, chipTotal);

  next = {
    ...next,
    pendingJokerOffers: outcome.perkOffers,
  };

  return next;
}

export { buildWheelOutcome as previewWheelOutcome };
