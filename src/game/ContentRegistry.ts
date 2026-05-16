import type { InfiniteScalingParams, SliceDefinition, WheelDefinition } from "../schemas";
import {
  getPipelineForFloor,
  getScalingParams,
  INFINITE_SCALING,
  RUN_DEFAULTS,
  RUN_LOOP,
  SHOP_PERK_TREE,
  WHEEL_COUNT,
  WHEEL_ROTATION,
  WHEEL_STAGES,
} from "./loop";
import { SLICE_POOLS, type SlicePoolId } from "./prizes";
import { ICON_REGISTRY } from "./content/iconRegistry";
import { buildGameContentSnapshot, type GameContentSnapshot } from "./content.snapshot";

export const GameContent = {
  icons: ICON_REGISTRY,
  defaults: RUN_DEFAULTS,
  loop: RUN_LOOP,
  infinite: INFINITE_SCALING,
  rotation: WHEEL_ROTATION,
  wheelCount: WHEEL_COUNT,
  stages: WHEEL_STAGES,
  shop: SHOP_PERK_TREE,
  slicePools: SLICE_POOLS,

  getWheelPipeline: getPipelineForFloor,
  getSlicePool(poolId: string): SliceDefinition[] {
    return SLICE_POOLS[poolId as SlicePoolId] ?? SLICE_POOLS.base ?? [];
  },
  getScalingParams,
  snapshot: (): GameContentSnapshot => buildGameContentSnapshot(),

  validate(): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const w of WHEEL_ROTATION) {
      if (SLICE_POOLS[w.slicePoolId as SlicePoolId] == null) {
        errors.push(`Wheel "${w.id}" → unknown pool "${w.slicePoolId}"`);
      }
    }
    return { ok: errors.length === 0, errors };
  },
} as const;
