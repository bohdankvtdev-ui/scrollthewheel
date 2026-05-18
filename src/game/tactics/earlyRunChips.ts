import type { RunState } from "../../schemas";

/**
 * Flat chip grants after W1 / W2 spins (for shop + planning before W3 Risk).
 * Bypasses `chipGainMult` so the full amount always lands.
 */
export const EARLY_RUN_CHIP_BONUS = {
  afterWheel1: 12,
  afterWheel2: 15,
} as const;

export type EarlyChipGrant = { chips: number; label: string } | null;

function addChipsFlat(run: RunState, amount: number): RunState {
  return {
    ...run,
    chipsEarnedThisRun: (run.chipsEarnedThisRun ?? 0) + amount,
  };
}

/** Grant once when a spin completes on wheel index 0 or 1. */
export function grantEarlyRunChipBonusOnSpinComplete(
  run: RunState,
  completedWheelIndex: number
): { run: RunState; grant: EarlyChipGrant } {
  const fx = run.runEffects ?? {};

  if (completedWheelIndex === 0 && !fx.earlyChipBonus0) {
    const chips = EARLY_RUN_CHIP_BONUS.afterWheel1;
    return {
      run: addChipsFlat(
        { ...run, runEffects: { ...fx, earlyChipBonus0: true } },
        chips
      ),
      grant: { chips, label: `Prep fund +${chips} chips` },
    };
  }

  if (completedWheelIndex === 1 && !fx.earlyChipBonus1) {
    const chips = EARLY_RUN_CHIP_BONUS.afterWheel2;
    return {
      run: addChipsFlat(
        { ...run, runEffects: { ...fx, earlyChipBonus1: true } },
        chips
      ),
      grant: { chips, label: `Risk ahead — +${chips} chips` },
    };
  }

  return { run, grant: null };
}
