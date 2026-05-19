import { RunManager } from "../../systems/RunManager";
import { applyScalingToRun } from "../../systems/InfiniteScaling";
import { buildFloorWheels, syncRunWheels } from "../../systems/WheelSystem";
import type { RunState } from "../../schemas";
import { WHEEL_COUNT } from "../loop";

export const LAST_WHEEL_INDEX = WHEEL_COUNT - 1;

export function isBossWheelClaim(run: RunState, wheelIndex: number): boolean {
  return run.phase === "active" && wheelIndex === LAST_WHEEL_INDEX;
}

/** Next-cycle wheels for reel buffer B while swiping off boss wheel (no rewards applied). */
export function previewNextCycleRun(run: RunState): RunState {
  const nextFloor = run.floor + 1;
  let next: RunState = {
    ...run,
    floor: nextFloor,
    wheelIndex: 0,
    phase: "active",
  };
  next = applyScalingToRun(next, nextFloor);
  return syncRunWheels({ ...next, wheels: buildFloorWheels(next) });
}

/** Apply cycle rewards, pit-stop flag, and cycle-2 wheel 1 — overlay shown separately. */
export function transitionRunAfterBossClear(run: RunState): RunState {
  const cleared = RunManager.completeCycle(run);
  const cycle2 = RunManager.enterInfiniteFloor(cleared);
  return {
    ...cycle2,
    phase: "won",
    lastCycleReward: cleared.lastCycleReward,
    runEffects: {
      ...cycle2.runEffects,
      pitStopPending: cleared.runEffects?.pitStopPending ?? true,
    },
  };
}
