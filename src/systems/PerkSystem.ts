import { DEBUFF_CATALOG } from "../data/debuffs";
import { PERK_CATALOG } from "../data/perks";
import {
  applyPerkLossMult,
  applyPerkMoneyPayout,
  applyPerkPercentGain,
} from "../game/effects/applyPerkEffects";
import { isJokerSlotFull } from "../game/shop/jokerSlots";
import { RUN_DEFAULTS } from "../game/loop";
import { getRunMaxSliceCount, hasAdvancement } from "../game/advancements";
import { getArchetypeForWheelIndex } from "../game/wheels";
import type { RunState, SliceCount } from "../schemas";
import {
  expandSliceCapacity,
  remapWheelsAfterCapacityChange,
  syncRunWheels,
} from "./WheelSystem";

const MAX_SLICES = RUN_DEFAULTS.maxSliceCapacity;

export function getEffectiveSliceCapacity(run: RunState): SliceCount {
  const fromAdv = getRunMaxSliceCount(run.floor, run.advancements ?? []);
  return Math.max(run.sliceCapacity, fromAdv) as SliceCount;
}

export function addSliceSlots(run: RunState, delta: number = 1): RunState {
  const nextCap = Math.min(
    MAX_SLICES,
    Math.max(RUN_DEFAULTS.minSliceCapacity, run.sliceCapacity + delta)
  ) as SliceCount;
  if (nextCap <= run.sliceCapacity) return run;
  return {
    ...run,
    sliceCapacity: nextCap,
    pendingWheelRebuild: true,
  };
}

/** Apply pending +1/+2 layout — call before spin or on wheel advance. */
export function commitPendingWheelRebuild(run: RunState): RunState {
  if (!run.pendingWheelRebuild) return syncRunWheels(run);
  return syncRunWheels({
    ...remapWheelsAfterCapacityChange(run),
    pendingWheelRebuild: false,
  });
}

export function applyPerkAcquisition(run: RunState, perkId: string): RunState {
  if (PERK_CATALOG[perkId] == null) return run;

  const isSlice =
    perkId === "extra_slice" || perkId === "slice_expander";
  if (!isSlice && run.perks.includes(perkId)) return run;
  if (!isSlice && isJokerSlotFull(run)) return run;

  let next: RunState = run;
  if (!run.perks.includes(perkId)) {
    next = { ...next, perks: [...next.perks, perkId] };
  }

  if (isSlice) {
    next = addSliceSlots(next, 1);
  }

  if (perkId === "iron_reserve" || perkId === "safe_harbor") {
    next = { ...next, shields: (next.shields ?? 0) + 1 };
  }

  if (perkId === "double_down") {
    next = { ...next, doubleDownPending: true };
  }

  return next;
}

export function applyMoneyDelta(
  run: RunState,
  rawDelta: number,
  wheelIndex: number = run.wheelIndex
): RunState {
  if (rawDelta === 0) return run;

  const archetype = getArchetypeForWheelIndex(wheelIndex);
  let delta = applyPerkLossMult(rawDelta, run.perks, archetype);

  if (
    delta < 0 &&
    hasAdvancement(run, "soft_landing") &&
    !run.runEffects?.softLandingUsedThisCycle
  ) {
    delta = Math.floor(delta * 0.5);
    run = {
      ...run,
      runEffects: { ...run.runEffects, softLandingUsedThisCycle: true },
    };
  }

  if (delta < 0 && (run.shields ?? 0) > 0) {
    return { ...run, shields: (run.shields ?? 0) - 1 };
  }

  if (delta > 0) {
    delta = applyPerkMoneyPayout(delta, run.perks, run.floorsCleared ?? 0);
  }

  let doubleDownPending = run.doubleDownPending;
  if (delta > 0 && doubleDownPending) {
    delta *= 2;
    doubleDownPending = false;
  }

  if (delta < 0) {
    for (const debuffId of run.debuffs) {
      const d = DEBUFF_CATALOG[debuffId];
      if (d?.moneyTax != null) delta = Math.floor(delta * (1 - d.moneyTax));
    }
  }

  return { ...run, money: Math.max(0, run.money + delta), doubleDownPending };
}

export function applyBankPercent(run: RunState, percent: number): RunState {
  if (percent >= 0) {
    const gain = applyPerkPercentGain(
      Math.floor(run.money * percent),
      run.perks,
      run.modifiers?.percentGainMult ?? 1
    );
    return applyMoneyDelta(run, gain, run.wheelIndex);
  }
  if ((run.shields ?? 0) > 0) {
    return { ...run, shields: (run.shields ?? 0) - 1 };
  }
  const loss = Math.floor(run.money * Math.abs(percent));
  return { ...run, money: Math.max(0, run.money - loss) };
}

export function applyWipeBank(run: RunState): RunState {
  if ((run.shields ?? 0) > 0) {
    return { ...run, shields: (run.shields ?? 0) - 1 };
  }
  return { ...run, money: 0 };
}

export function applySliceExpansion(run: RunState, delta: number = 1): RunState {
  return addSliceSlots(run, delta);
}
