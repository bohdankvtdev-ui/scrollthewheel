import type { WheelConfigId } from "./types";
import type { PrizeCatalogId } from "./prizeCatalog";

export const NOTHING_PRIZE_ID = "neutral_nothing" as const satisfies PrizeCatalogId;

const HARSH_WHEELS = new Set<WheelConfigId>(["wheel_3", "wheel_5", "wheel_8", "wheel_9"]);
const BOOST_WHEELS = new Set<WheelConfigId>(["wheel_1", "wheel_2", "wheel_4", "wheel_6", "wheel_7"]);

/** How many "Nothing" wedges to inject after the main pool pick (cycle 1 = none). */
export function nothingWedgeCount(
  configId: WheelConfigId,
  cycle: number,
  sliceCount: number
): number {
  if (cycle <= 1) return 0;

  const maxNothing = Math.max(0, sliceCount - 4);

  if (cycle === 2) {
    if (HARSH_WHEELS.has(configId)) return Math.min(1, maxNothing);
    return 0;
  }

  let count = 1 + Math.floor((cycle - 2) / 2);
  if (HARSH_WHEELS.has(configId)) count += 1;
  if (BOOST_WHEELS.has(configId) && cycle >= 4) count += 1;

  return Math.min(maxNothing, count);
}

/** Replace random wedges with the shared Nothing prize. */
export function injectNothingWedges(
  prizes: PrizeCatalogId[],
  count: number,
  rng: () => number
): PrizeCatalogId[] {
  if (count <= 0 || prizes.length === 0) return prizes;

  const out = [...prizes];
  const replaceable = out
    .map((id, index) => ({ id, index }))
    .filter((row) => row.id !== NOTHING_PRIZE_ID);

  let left = Math.min(count, replaceable.length);
  while (left > 0 && replaceable.length > 0) {
    const pick = Math.floor(rng() * replaceable.length);
    const { index } = replaceable.splice(pick, 1)[0]!;
    out[index] = NOTHING_PRIZE_ID;
    left -= 1;
  }

  return out;
}

export function layoutWithNothing(
  prizes: PrizeCatalogId[],
  configId: WheelConfigId,
  cycle: number,
  sliceCount: number,
  rng: () => number
): PrizeCatalogId[] {
  const count = nothingWedgeCount(configId, cycle, sliceCount);
  return injectNothingWedges(prizes, count, rng);
}
