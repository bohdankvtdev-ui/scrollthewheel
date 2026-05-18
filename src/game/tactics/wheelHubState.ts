import type { ScrollWheelRound } from "../../../features/cash-spin/reelStripModel";
import type { RunState } from "../../schemas";
import { getMicroChoiceOffers } from "./microChoices";
import { tacticUsedOnWheel } from "./tacticState";

export type HubMode = "spin" | "claim" | "busy";

export type WheelInteractInput = {
  run: RunState;
  /** Reel slot index being rendered (must match `run.wheelIndex` to interact). */
  roundIndex: number;
  isSpinning: boolean;
  awaitingClaim: boolean;
  gambleFlipActive: boolean;
  isReelActive: boolean;
  round: ScrollWheelRound | null | undefined;
};

/** Single source of truth for hub button + reel swipe eligibility. */
export function deriveHubMode(input: WheelInteractInput): HubMode {
  const {
    run,
    roundIndex,
    isSpinning,
    awaitingClaim,
    gambleFlipActive,
    isReelActive,
    round,
  } = input;

  if (!isReelActive || round == null) return "busy";
  if (roundIndex !== run.wheelIndex) return "busy";
  if (run.phase !== "active") return "busy";
  if (isSpinning) return "busy";

  if (gambleFlipActive) return "spin";

  /** Post-spin: hub disabled until tactic pick and/or swipe to next wheel. */
  if (awaitingClaim) return "busy";

  if (round.status === "ready") return "spin";

  return "busy";
}

export function deriveSpinLocked(hubMode: HubMode, isSpinning: boolean): boolean {
  if (hubMode === "claim") return false;
  if (hubMode === "busy") return true;
  return isSpinning;
}

export function shouldShowTacticPicker(
  run: RunState,
  awaitingClaim: boolean,
  isSpinning: boolean,
  gambleFlipActive: boolean,
  hasPreSpinSnapshot: boolean
): boolean {
  if (!awaitingClaim || isSpinning || gambleFlipActive) return false;
  if (tacticUsedOnWheel(run, run.wheelIndex)) return false;
  return getMicroChoiceOffers(run, run.wheelIndex, { hasPreSpinSnapshot }).length > 0;
}

export function labelFromHistory(run: RunState, wheelIndex: number): string | null {
  for (let i = run.history.length - 1; i >= 0; i--) {
    const h = run.history[i]!;
    if (h.wheelIndex !== wheelIndex) continue;
    const wheel = run.wheels[wheelIndex];
    const slice = wheel?.slices.find((s) => s.id === h.sliceId);
    return slice?.label ?? h.sliceId;
  }
  return null;
}

export type RunUiTacticFields = {
  awaitingClaim: boolean;
  gambleFlipActive: boolean;
  isSpinning: boolean;
  /** Wheel index when `isSpinning` was set — stale spins clear when this ≠ current wheel. */
  spinWheelIndex: number | null;
  lastResultLabel: string | null;
  lastSliceId: string | null;
  lastEffect: unknown;
  lastRewardKind: string | null;
  moneyReveal: { before: number; delta: number } | null;
};

/** Heal inconsistent UI after tactics / hydrate / interrupted spins. */
export function reconcileRunUi(run: RunState, ui: RunUiTacticFields): RunUiTacticFields {
  const next = { ...ui };
  const wi = run.wheelIndex;

  if (run.phase !== "active") {
    next.gambleFlipActive = false;
    next.awaitingClaim = false;
    return next;
  }

  if (next.gambleFlipActive && next.awaitingClaim) {
    next.awaitingClaim = false;
  }

  const hasHistory = run.history.some((h) => h.wheelIndex === wi);

  if (next.gambleFlipActive) {
    if (!hasHistory && !next.isSpinning) {
      next.gambleFlipActive = false;
    }
    return next;
  }

  if (hasHistory && !next.isSpinning && !next.awaitingClaim) {
    next.awaitingClaim = true;
    if (next.lastResultLabel == null) {
      next.lastResultLabel = labelFromHistory(run, wi);
    }
  }

  if (next.awaitingClaim && !hasHistory && !next.isSpinning) {
    next.awaitingClaim = false;
    next.lastResultLabel = null;
    next.lastSliceId = null;
  }

  if (next.awaitingClaim && next.lastResultLabel == null) {
    next.lastResultLabel = labelFromHistory(run, wi) ?? "Result";
  }

  if (next.isSpinning && next.spinWheelIndex != null && next.spinWheelIndex !== wi) {
    next.isSpinning = false;
    next.spinWheelIndex = null;
  }
  if (!next.isSpinning) {
    next.spinWheelIndex = null;
  }

  return next;
}

export function clearTacticOffersOnRun(run: RunState): RunState {
  return {
    ...run,
    runEffects: {
      ...run.runEffects,
      microChoiceOffers: undefined,
      microChoiceOffersWheel: undefined,
    },
  };
}
