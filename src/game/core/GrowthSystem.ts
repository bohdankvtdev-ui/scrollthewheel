import {
  applySliceCapacityFromScaling,
  getScalingParams,
  INFINITE_SCALING,
} from "../loop";
import { applyScalingToRun } from "../../systems/InfiniteScaling";
import type { InfiniteScalingParams, RunState, SliceCount } from "../../schemas";

/**
 * Run scaling / "size" growth — slice capacity, stakes, economy inflation per cycle.
 */
export const GrowthSystem = {
  paramsForCycle(cycle: number): InfiniteScalingParams {
    return getScalingParams(cycle);
  },

  applyCycleScaling(run: RunState): RunState {
    return applyScalingToRun(run);
  },

  nextSliceCapacity(current: SliceCount, params: InfiniteScalingParams): SliceCount {
    return applySliceCapacityFromScaling(current, params);
  },

  config: INFINITE_SCALING,
};
