import { getBlindQuotaForRun, RUN_DEFAULTS } from "../loop";
import { FLOOR_WHEEL_COUNT } from "../wheels";
import type { RunEndResult, RunState } from "./types";
import { DEFAULT_RUN_MODIFIERS } from "./types";
import { computeRunChipAward } from "./chipsScoring";
import { RunManager } from "../../systems/RunManager";
import type { SliceDefinition } from "../../schemas";
import { resolveAndApplyWheel } from "../services/wheelResolver";
import { normalizeRunState } from "./normalize";

export function createRunState(floor: number = RUN_DEFAULTS.startingFloor): RunState {
  return normalizeRunState({
    ...(RunManager.createInitialRun(floor) as RunState),
    chipsEarnedThisRun: 0,
    modifiers: { ...DEFAULT_RUN_MODIFIERS },
    pendingJokerOffers: [],
  });
}

export function canSpinWheel(run: RunState | null, wheelIndex: number): boolean {
  return RunManager.canSpin(run, wheelIndex);
}

export function resolveWheelSpin(
  run: RunState,
  wheelIndex: number,
  slice: SliceDefinition
): RunState {
  return resolveAndApplyWheel(run, wheelIndex, slice);
}

export function advanceToNextWheel(run: RunState): RunState {
  return RunManager.advanceWheel(run) as RunState;
}

export function isFloorComplete(run: RunState): boolean {
  return run.wheelIndex >= FLOOR_WHEEL_COUNT - 1 && !run.history.some((h) => h.wheelIndex === FLOOR_WHEEL_COUNT - 1);
}

export function finalizeRunEnd(
  run: RunState,
  grantToMeta: (chips: number, floor: number) => number
): { run: RunState; result: RunEndResult } {
  const chipsAwarded = computeRunChipAward(run);
  const totalChipsAfter = grantToMeta(chipsAwarded, run.floor);
  return {
    run,
    result: {
      phase: run.phase,
      chipsAwarded,
      totalChipsAfter,
      floorReached: run.floor,
    },
  };
}

export function startNextFloor(run: RunState): RunState {
  return RunManager.enterInfiniteFloor(run) as RunState;
}

/** Recompute blind quota when perks change. */
export function refreshBlindQuota(run: RunState): RunState {
  return {
    ...run,
    blindQuota: getBlindQuotaForRun(run.floor, run.perks),
  };
}
