import { getSliceCountForWheel } from "../../advancements/sliceCount";
import { landShapeForSliceCount } from "../../cycle/cycleProgression";
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { FloorWheelOrderId } from "./wheelDatabase";
import type { WheelConfigId, WheelPrizeSlot } from "./types";
import { applyCycleEconomyToPayload, formatPrizeLabel } from "./cycleEconomy";
import { getAdvancementPoolCycleBonus } from "../../advancements";
import { getCycleAdvancement } from "../../effects/cycleAdvancement";
import { distributeLandChances, mulberry32, pickWeighted, wheelLayoutSeed } from "./prizeRng";
import { getBossPoolAdjustments } from "../../boss/bossWheel";
import {
  BUILDER_POOL,
  BOSS_POOL,
  CHAOS_POOL,
  DRAIN_POOL,
  LAND_SHAPE_6_EVEN,
  LAND_SHAPE_LUCKY,
  LUCKY_POOL,
  MONEY_TIER_PRIZES,
  PERK_WHEEL_POOL,
  RISK_POOL,
  type PoolPick,
} from "./wheelPrizePools";

export type BuildWheelPrizeOptions = {
  runId: string;
  cycle: number;
  ownedPerks?: string[];
  advancements?: string[];
  banishedPrizes?: string[];
};

function filterPool(pool: PoolPick[], cycle: number, banished: string[]): PoolPick[] {
  const banned = new Set(banished);
  return pool.filter((p) => {
    if (p.minCycle != null && cycle < p.minCycle) return false;
    if (p.maxCycle != null && cycle > p.maxCycle) return false;
    if (banned.has(p.prize)) return false;
    return true;
  });
}

function pickUniqueFromPool(
  rng: () => number,
  pool: PoolPick[],
  count: number
): PrizeCatalogId[] {
  const available = [...pool];
  const picked: PrizeCatalogId[] = [];
  const used = new Set<string>();

  while (picked.length < count && available.length > 0) {
    const item = pickWeighted(rng, available);
    const id = item.prize as PrizeCatalogId;
    const idx = available.findIndex((a) => a.prize === item.prize);
    if (idx >= 0) available.splice(idx, 1);
    if (used.has(id)) continue;
    used.add(id);
    picked.push(id);
  }

  while (picked.length < count && pool.length > 0) {
    const item = pickWeighted(rng, pool);
    picked.push(item.prize as PrizeCatalogId);
  }

  return picked.slice(0, count);
}

function slotsFromPrizes(prizes: PrizeCatalogId[], landShape: readonly number[]): WheelPrizeSlot[] {
  const chances = distributeLandChances(landShape.slice(0, prizes.length));
  return prizes.map((prize, i) => ({
    prize,
    chance: chances[i] ?? Math.floor(100 / prizes.length),
  }));
}

function sliceCountFor(
  configId: WheelConfigId,
  cycle: number,
  advancements: string[]
): number {
  return getSliceCountForWheel(cycle, advancements, configId as FloorWheelOrderId);
}

function buildMoneyWheel(cycle: number, advancements: string[], banished: string[]): WheelPrizeSlot[] {
  const n = sliceCountFor("wheel_1", cycle, advancements);
  const pool: PoolPick[] = [
    ...MONEY_TIER_PRIZES.map((t) => ({ prize: t.prize, weight: 10 })),
    { prize: "money_loss_40", weight: 8 },
    { prize: "money_loss_60", weight: 6, minCycle: 2 },
  ];
  const rng = mulberry32(wheelLayoutSeed("money", cycle, "wheel_1"));
  const picked = pickUniqueFromPool(rng, filterPool(pool, cycle, banished), n);
  return slotsFromPrizes(picked, landShapeForSliceCount(n, false));
}

/** Wheel 2 cycle 1: balanced ±5% / 10% / 15% of bank. */
const PERCENT_WHEEL_CYCLE1: PrizeCatalogId[] = [
  "bank_loss_5",
  "bank_loss_10",
  "bank_loss_15",
  "bank_gain_5",
  "bank_gain_10",
  "bank_gain_15",
];

function percentWheelPrizePool(cycle: number): PrizeCatalogId[] {
  if (cycle <= 1) return [...PERCENT_WHEEL_CYCLE1];
  return [
    ...PERCENT_WHEEL_CYCLE1,
    "bank_loss_30",
    "bank_gain_30",
    ...(cycle >= 4 ? (["bank_loss_40", "bank_gain_40"] as PrizeCatalogId[]) : []),
  ];
}

function buildPercentWheel(
  cycle: number,
  advancements: string[],
  banished: string[]
): WheelPrizeSlot[] {
  const n = sliceCountFor("wheel_2", cycle, advancements);
  const allowed = percentWheelPrizePool(cycle).filter((id) => !banished.includes(id));
  const rng = mulberry32(wheelLayoutSeed("pct", cycle, "wheel_2"));
  const pool: PoolPick[] = allowed.map((prize) => ({ prize, weight: 10 }));
  const picked = pickUniqueFromPool(rng, pool, n);
  return slotsFromPrizes(picked, landShapeForSliceCount(n, false));
}

function catalogPerkId(prizeId: PrizeCatalogId): string | null {
  const def = PRIZE_CATALOG[prizeId];
  const pid = def?.payload?.perkId;
  return typeof pid === "string" ? pid : null;
}

function buildPerkWheel(
  cycle: number,
  ownedPerks: string[],
  advancements: string[],
  banished: string[],
  rng: () => number
): WheelPrizeSlot[] {
  const n = sliceCountFor("wheel_4", cycle, advancements);
  const pool = PERK_WHEEL_POOL.filter((id) => {
    const pid = catalogPerkId(id);
    return (pid == null || !ownedPerks.includes(pid)) && !banished.includes(id);
  });
  const tierBias: PoolPick[] = (pool.length > 0 ? pool : PERK_WHEEL_POOL).map((id) => {
    const tier = id.includes("compounder") || id.includes("coupon") ? 2 : 0;
    const weight = tier >= 2 && cycle < 2 ? 2 : tier === 0 ? 10 : 6;
    return { prize: id, weight };
  });
  const picked = pickUniqueFromPool(rng, tierBias, n);
  return slotsFromPrizes(picked, landShapeForSliceCount(n, false));
}

function buildPoolWheel(
  pool: PoolPick[],
  cycle: number,
  rng: () => number,
  sliceCount: number,
  harshFirst: boolean,
  banished: string[]
): WheelPrizeSlot[] {
  const filtered = filterPool(pool, cycle, banished);
  const picked = pickUniqueFromPool(rng, filtered, sliceCount);
  return slotsFromPrizes(picked, landShapeForSliceCount(sliceCount, harshFirst));
}

export function buildPrizeSlotsForWheel(
  configId: WheelConfigId,
  options: BuildWheelPrizeOptions
): WheelPrizeSlot[] {
  const { runId, cycle, ownedPerks = [], advancements = [], banishedPrizes = [] } = options;
  const poolCycle =
    getCycleAdvancement(cycle).effectivePoolCycle + getAdvancementPoolCycleBonus(advancements);
  const seed = wheelLayoutSeed(runId, cycle, configId);
  const rng = mulberry32(seed);
  const banished = banishedPrizes ?? [];
  const n = sliceCountFor(configId, cycle, advancements);

  switch (configId) {
    case "wheel_1":
      return buildMoneyWheel(cycle, advancements, banished);
    case "wheel_2":
      return buildPercentWheel(cycle, advancements, banished);
    case "wheel_3":
      return buildPoolWheel(RISK_POOL, poolCycle, rng, n, true, banished);
    case "wheel_4":
      return buildPerkWheel(poolCycle, ownedPerks, advancements, banished, rng);
    case "wheel_5":
      return buildPoolWheel(DRAIN_POOL, poolCycle, rng, n, true, banished);
    case "wheel_6":
      return buildPoolWheel(LUCKY_POOL, poolCycle, rng, n, false, banished);
    case "wheel_7":
      return buildPoolWheel(BUILDER_POOL, poolCycle, rng, n, false, banished);
    case "wheel_8":
      return buildPoolWheel(CHAOS_POOL, poolCycle, rng, n, true, banished);
    case "wheel_9": {
      const perkCount = ownedPerks.length;
      const merged = [
        ...filterPool(BOSS_POOL, poolCycle, banished),
        ...getBossPoolAdjustments(poolCycle, perkCount),
      ];
      return buildPoolWheel(merged, poolCycle, rng, n, true, banished);
    }
    default:
      return buildMoneyWheel(cycle, advancements, banished);
  }
}

export function finalizeSlicePayload(
  templatePayload: Record<string, unknown>,
  kind: string,
  label: string,
  cycle: number
): { payload: Record<string, unknown>; label: string } {
  const payload = applyCycleEconomyToPayload(templatePayload, kind, cycle);
  return {
    payload,
    label: formatPrizeLabel(kind, payload as Parameters<typeof formatPrizeLabel>[1], label),
  };
}
