import { DEBUFF_CATALOG } from "../data/debuffs";
import { PERK_CATALOG } from "../data/perks";
import { isJokerSlotFull } from "../game/shop/jokerSlots";
import { getBlindQuotaForRun, RUN_DEFAULTS } from "../game/loop";
import type { RunState, SliceCount } from "../schemas";
import {
  expandSliceCapacity,
  remapWheelsAfterCapacityChange,
  syncRunWheels,
} from "./WheelSystem";

const MAX_SLICES = RUN_DEFAULTS.maxSliceCapacity;

export function getEffectiveSliceCapacity(run: RunState): SliceCount {
  return run.sliceCapacity;
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

  return {
    ...next,
    blindQuota: getBlindQuotaForRun(next.floor, next.perks),
  };
}

export function applyMoneyDelta(run: RunState, rawDelta: number): RunState {
  if (rawDelta === 0) return run;

  let delta = rawDelta;

  if (delta < 0 && (run.shields ?? 0) > 0) {
    return { ...run, shields: (run.shields ?? 0) - 1 };
  }

  if (delta > 0 && run.perks.includes("gold_rush")) {
    delta = Math.floor(delta * 1.25);
  }
  if (delta > 0 && run.perks.includes("vip_roller")) {
    delta = Math.floor(delta * 1.2);
  }
  if (delta > 0 && run.perks.includes("high_roller")) {
    delta = Math.floor(delta * 1.15);
  }
  if (delta > 0 && run.perks.includes("compounder")) {
    const fc = Math.max(0, run.floorsCleared ?? 0);
    delta = Math.floor(delta * (1 + fc * 0.05));
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
  if (percent >= 0) return applyMoneyDelta(run, Math.floor(run.money * percent));
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
