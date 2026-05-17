import type { SliceDefinition } from "../../schemas";
import type { RunState } from "./types";
import { isSliceNegative } from "./runEffects";

/** Heat meter — bad spins fill it; good spins cool it. At max, run ends. */
export const RUN_PRESSURE = {
  max: 5,
  loseAt: 5,
  /** Consecutive wins → bonus chips on next payout (index = streak, capped). */
  winStreakChipBonus: [0, 0, 1, 2, 3, 5, 6] as const,
  /** After this many losses in a row, each extra loss adds +1 pressure. */
  lossStreakEscalateAt: 2,
} as const;

export type SpinOutcomeKind = "win" | "loss" | "neutral";

export function classifySpinOutcome(
  slice: SliceDefinition,
  moneyBefore: number,
  moneyAfter: number,
  shieldBlocked: boolean
): SpinOutcomeKind {
  if (shieldBlocked) return "neutral";

  const delta = moneyAfter - moneyBefore;
  if (delta > 0) return "win";
  if (delta < 0) return "loss";

  if (isSliceNegative(slice)) {
    return moneyBefore <= 0 ? "loss" : "loss";
  }
  if (slice.kind === "neutral" && moneyBefore <= 0) return "loss";
  return "neutral";
}

export function pressureGainForOutcome(
  kind: SpinOutcomeKind,
  slice: SliceDefinition,
  moneyBefore: number,
  lossStreak: number
): number {
  if (kind === "win") return 0;
  if (kind === "neutral") return moneyBefore <= 0 ? 1 : 0;

  let gain = 1;
  if (isSliceNegative(slice)) {
    if (slice.kind === "bank_wipe" || slice.payload.wipeBank) gain = 2;
    else if (slice.payload.bankPercent != null && slice.payload.bankPercent < 0) gain = 2;
    else if (moneyBefore <= 0) gain = 2;
  }
  if (lossStreak >= RUN_PRESSURE.lossStreakEscalateAt) {
    gain += 1;
  }
  return gain;
}

export function applyRunPressureAfterSpin(
  run: RunState,
  slice: SliceDefinition,
  moneyBefore: number,
  moneyAfter: number,
  shieldBlocked = false
): RunState {
  const kind = classifySpinOutcome(slice, moneyBefore, moneyAfter, shieldBlocked);
  const prevWin = run.winStreak ?? 0;
  const prevLoss = run.lossStreak ?? 0;
  let pressure = run.pressure ?? 0;
  let winStreak = prevWin;
  let lossStreak = prevLoss;

  if (kind === "win") {
    winStreak = prevWin + 1;
    lossStreak = 0;
    pressure = Math.max(0, pressure - 1);
  } else if (kind === "loss") {
    lossStreak = prevLoss + 1;
    winStreak = 0;
    pressure = Math.min(
      RUN_PRESSURE.max,
      pressure + pressureGainForOutcome(kind, slice, moneyBefore, prevLoss)
    );
  } else {
    winStreak = 0;
    lossStreak = prevLoss;
    if (moneyBefore <= 0) {
      pressure = Math.min(RUN_PRESSURE.max, pressure + 1);
    }
  }

  return { ...run, pressure, winStreak, lossStreak };
}

export function winStreakChipBonus(winStreak: number): number {
  const idx = Math.min(winStreak, RUN_PRESSURE.winStreakChipBonus.length - 1);
  return RUN_PRESSURE.winStreakChipBonus[idx] ?? 0;
}

export function isPressureRunOver(run: RunState): boolean {
  return (run.pressure ?? 0) >= RUN_PRESSURE.loseAt;
}

export function canPlayAtZeroBank(run: RunState): boolean {
  return (run.pressure ?? 0) < RUN_PRESSURE.loseAt;
}
