import type { SliceDefinition } from "../../schemas";
import type { RunState } from "./types";
import { isSliceNegative } from "./runEffects";

/** Win-streak rewards — no loss streak or heat meter. */
export const RUN_STREAKS = {
  winStreakChipBonus: [0, 0, 1, 2, 4, 6, 8, 10, 12] as const,
  winStreakMoneyBonusPerStep: 0.04,
  winStreakMoneyBonusCap: 0.28,
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

  if (isSliceNegative(slice)) return "loss";
  if (slice.kind === "neutral" && moneyBefore <= 0) return "loss";
  return "neutral";
}

/** Track consecutive wins for chip/cash bonuses only. */
export function applyRunStreakAfterSpin(
  run: RunState,
  slice: SliceDefinition,
  moneyBefore: number,
  moneyAfter: number,
  shieldBlocked = false
): RunState {
  const kind = classifySpinOutcome(slice, moneyBefore, moneyAfter, shieldBlocked);
  const prevWin = run.winStreak ?? 0;

  if (kind === "win") {
    return { ...run, winStreak: prevWin + 1 };
  }
  if (kind === "loss") {
    return { ...run, winStreak: 0 };
  }
  return { ...run, winStreak: 0 };
}

export function winStreakChipBonus(winStreak: number): number {
  const idx = Math.min(winStreak, RUN_STREAKS.winStreakChipBonus.length - 1);
  return RUN_STREAKS.winStreakChipBonus[idx] ?? 0;
}

export function winStreakMoneyMult(winStreak: number): number {
  if (winStreak < 2) return 1;
  const steps = winStreak - 1;
  const bonus = Math.min(
    RUN_STREAKS.winStreakMoneyBonusCap,
    steps * RUN_STREAKS.winStreakMoneyBonusPerStep
  );
  return 1 + bonus;
}

export function updatePeakMoney(run: RunState): RunState {
  const peak = Math.max(run.peakMoney ?? 0, run.money);
  if (peak === run.peakMoney) return run;
  return { ...run, peakMoney: peak };
}
