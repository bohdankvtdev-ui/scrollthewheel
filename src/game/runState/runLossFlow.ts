import type { RunState } from "../../schemas";
import { isBankruptMoneyReveal, type MoneyReveal } from "../moneyReveal";
import { rollDesperationOffers, type DesperationId } from "../tactics/desperationTactics";

export type LossFlowUiPatch = {
  showDesperationPick: boolean;
  desperationOffers: DesperationId[];
  runEndFinalized: boolean;
  awaitingClaim: boolean;
  moneyReveal: null;
  isSpinning: boolean;
  spinWheelIndex: null;
};

/** Whether the full-screen "Broke" panel should show (not last-chance, not mid-reveal). */
export function shouldShowRunEndModal(input: {
  phase: RunState["phase"];
  bossCyclePhase: "none" | "reward";
  showDesperationPick: boolean;
  runEndFinalized: boolean;
  moneyReveal: MoneyReveal | null;
}): boolean {
  const { phase, bossCyclePhase, showDesperationPick, runEndFinalized, moneyReveal } = input;

  if (bossCyclePhase !== "none") return false;
  if (showDesperationPick) return false;
  if (moneyReveal != null && isBankruptMoneyReveal(moneyReveal)) return false;

  if (phase === "alpha_won") return true;

  if (phase === "won") return false;

  if (phase === "active") return false;

  if (phase === "lost_money") return runEndFinalized;

  return true;
}

export function buildDesperationLossFlow(
  run: RunState,
  hasPreSpinSnapshot: boolean
): { run: RunState; ui: LossFlowUiPatch } | null {
  const offers = rollDesperationOffers(run, { hasPreSpinSnapshot });
  if (offers.length === 0) return null;

  return {
    run: {
      ...run,
      runEffects: {
        ...run.runEffects,
        desperationOfferedThisRun: true,
      },
    },
    ui: {
      showDesperationPick: true,
      desperationOffers: offers,
      runEndFinalized: false,
      awaitingClaim: false,
      moneyReveal: null,
      isSpinning: false,
      spinWheelIndex: null,
    },
  };
}
