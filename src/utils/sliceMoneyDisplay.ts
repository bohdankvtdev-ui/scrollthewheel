import { getArchetypeForWheelIndex } from "../game/wheels";
import { getWheelTypeAdjustments } from "../game/perks/wheelTypeModifiers";
import { winStreakMoneyMult } from "../game/runState/runStreaks";
import type { RunState, SliceDefinition } from "../schemas";
import { sliceWheelCaption } from "./sliceWheelCaption";

export function getSliceMoneyMultipliers(run: RunState, wheelIndex: number) {
  const archetype = getArchetypeForWheelIndex(wheelIndex);
  const typeAdj = getWheelTypeAdjustments(run, archetype, run.history.length);
  const hotForgeLvl = run.chipForge?.forge_hot ?? 0;
  const hotForgeMult =
    hotForgeLvl > 0
      ? 1 + hotForgeLvl * 0.02 * Math.max(0, (run.winStreak ?? 0) - 1)
      : 1;
  return {
    gainMult: typeAdj.moneyGainMult * winStreakMoneyMult(run.winStreak ?? 0) * hotForgeMult,
    lossMult: typeAdj.moneyLossMult,
  };
}

export function adjustSliceForRun(
  run: RunState,
  slice: SliceDefinition,
  wheelIndex: number
): SliceDefinition {
  const { gainMult, lossMult } = getSliceMoneyMultipliers(run, wheelIndex);
  const { payload } = slice;
  if (payload.moneyDelta != null) {
    const mult = payload.moneyDelta > 0 ? gainMult : lossMult;
    return {
      ...slice,
      payload: { ...payload, moneyDelta: Math.round(payload.moneyDelta * mult) },
    };
  }
  if (payload.bankPercent != null) {
    const mult = payload.bankPercent >= 0 ? gainMult : lossMult;
    return { ...slice, payload: { ...payload, bankPercent: payload.bankPercent * mult } };
  }
  return slice;
}

export function computeSliceMoneyDelta(
  run: RunState,
  slice: SliceDefinition,
  wheelIndex: number
): number {
  const { payload, kind } = adjustSliceForRun(run, slice, wheelIndex);
  if (payload.wipeBank || kind === "bank_wipe") return -run.money;
  if (payload.bankPercent != null) {
    return payload.bankPercent >= 0
      ? Math.floor(run.money * payload.bankPercent)
      : -Math.floor(run.money * Math.abs(payload.bankPercent));
  }
  if (payload.moneyDelta != null) return payload.moneyDelta;
  return 0;
}

function formatCashCaption(amount: number): string {
  const abs = Math.abs(amount);
  const body = abs >= 1000 ? `${Math.round(abs / 100) / 10}K` : `${abs}`;
  return amount >= 0 ? `+$${body}` : `-$${body}`;
}

/**
 * On-wheel caption: % wedges show % (with perk-adjusted rate); flat cash shows $.
 * Dollar payout animation lives in the header only — not on wedge labels.
 */
export function sliceWheelCaptionForRun(
  run: RunState,
  slice: SliceDefinition,
  wheelIndex: number
): string {
  const adjusted = adjustSliceForRun(run, slice, wheelIndex);
  const { payload, kind } = adjusted;

  if (payload.bankPercent != null) {
    return sliceWheelCaption(adjusted);
  }

  if (payload.moneyDelta != null && payload.moneyDelta !== 0) {
    return formatCashCaption(payload.moneyDelta);
  }

  if (payload.wipeBank || kind === "bank_wipe") return "ALL";

  return sliceWheelCaption(adjusted);
}
