import { ICON_REGISTRY } from "./content/iconRegistry";
import { CARD_CATALOG } from "../data/cards";
import { DEBUFF_CATALOG } from "../data/debuffs";
import { PERK_CATALOG } from "../data/perks";
import { RELIC_CATALOG } from "../data/relics";
import { GDD_LOOP_SUMMARY, GDD_PACING, PRIZE_TAXONOMY } from "./gdd";
import {
  getScalingParams,
  INFINITE_SCALING,
  RUN_DEFAULTS,
  RUN_LOOP,
  SHOP_PERK_TREE,
  WHEEL_COUNT,
  WHEEL_ROTATION,
} from "./loop";
import { SLICE_POOLS, SLICE_POOL_IDS } from "./prizes";

export type GameContentSnapshot = {
  meta: { version: number; generatedAt: string };
  gdd: { pacing: typeof GDD_PACING; loop: typeof GDD_LOOP_SUMMARY; prizes: typeof PRIZE_TAXONOMY };
  loop: typeof RUN_LOOP;
  runDefaults: typeof RUN_DEFAULTS;
  infiniteScaling: typeof INFINITE_SCALING;
  scalingPreview: ReturnType<typeof getScalingParams>[];
  wheelRotation: typeof WHEEL_ROTATION;
  shopTree: typeof SHOP_PERK_TREE;
  slicePoolIds: readonly string[];
  sliceCounts: Record<string, number>;
  perks: typeof PERK_CATALOG;
  debuffs: typeof DEBUFF_CATALOG;
  relics: typeof RELIC_CATALOG;
  cards: typeof CARD_CATALOG;
  iconRegistry: typeof ICON_REGISTRY;
};

export function buildGameContentSnapshot(): GameContentSnapshot {
  const sliceCounts = Object.fromEntries(
    SLICE_POOL_IDS.map((id) => [id, SLICE_POOLS[id]?.length ?? 0])
  );
  return {
    meta: { version: 3, generatedAt: new Date().toISOString() },
    gdd: { pacing: GDD_PACING, loop: GDD_LOOP_SUMMARY, prizes: PRIZE_TAXONOMY },
    loop: RUN_LOOP,
    runDefaults: RUN_DEFAULTS,
    infiniteScaling: INFINITE_SCALING,
    scalingPreview: [1, 2, 3, 5, 10].map(getScalingParams),
    wheelRotation: WHEEL_ROTATION,
    shopTree: SHOP_PERK_TREE,
    slicePoolIds: SLICE_POOL_IDS,
    sliceCounts,
    perks: PERK_CATALOG,
    debuffs: DEBUFF_CATALOG,
    relics: RELIC_CATALOG,
    cards: CARD_CATALOG,
    iconRegistry: ICON_REGISTRY,
  };
}
