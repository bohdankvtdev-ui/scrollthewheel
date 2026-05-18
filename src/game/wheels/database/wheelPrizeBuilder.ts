import { getSliceCountForWheelWithBonus, LASER_MIN_SLICE_COUNT } from "../sliceCapacityBonus";
import { landShapeForSliceCount } from "../../cycle/cycleProgression";
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { FloorWheelOrderId } from "./wheelDatabase";
import type { WheelConfigId, WheelPrizeSlot } from "./types";
import { applyCycleEconomyToPayload, formatPrizeLabel } from "./cycleEconomy";
import { getAdvancementPoolCycleBonus } from "../../advancements";
import { getCycleAdvancement } from "../../effects/cycleAdvancement";
import { distributeLandChances, mulberry32, pickWeighted, wheelLayoutSeed } from "./prizeRng";
import { FINAL_LAND_SHAPE, getBossPoolAdjustments } from "../../boss/bossWheel";
import {
  BUILDER_WEDGE_PRIZES,
  CHAOS_POOL,
  FINAL_WHEEL_POOL,
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
  /** Permanent +1 wedges from builder (not cycle scaling). */
  permanentWedgeBonus?: number;
  /** Wedges removed by Wedge Laser per config id. */
  wheelLaserCuts?: Partial<Record<string, number>>;
  /** Wedges removed by Insure tactic per config id. */
  wheelInsureCuts?: Partial<Record<string, number>>;
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
  _advancements: string[],
  wedgeBonus = 0,
  laserCuts = 0,
  insureCuts = 0
): number {
  const base = getSliceCountForWheelWithBonus(cycle, configId, wedgeBonus);
  return Math.max(LASER_MIN_SLICE_COUNT, base - laserCuts - insureCuts);
}

function buildMoneyWheel(
  cycle: number,
  advancements: string[],
  banished: string[],
  sliceCount: number
): WheelPrizeSlot[] {
  const n = sliceCount;
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
  banished: string[],
  sliceCount: number
): WheelPrizeSlot[] {
  const n = sliceCount;
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
  rng: () => number,
  sliceCount: number
): WheelPrizeSlot[] {
  const n = sliceCount;
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

function landShapeForFinalWheel(sliceCount: number): readonly number[] {
  if (sliceCount <= FINAL_LAND_SHAPE.length) {
    return FINAL_LAND_SHAPE.slice(0, sliceCount);
  }
  return landShapeForSliceCount(sliceCount, true);
}

function isFlatMoneyLossPrize(prize: string): boolean {
  return prize.startsWith("money_loss_");
}

function buildFinalWheel(
  poolCycle: number,
  ownedPerks: string[],
  banished: string[],
  rng: () => number,
  sliceCount: number
): WheelPrizeSlot[] {
  const merged = [
    ...filterPool(FINAL_WHEEL_POOL, poolCycle, banished),
    ...getBossPoolAdjustments(poolCycle, ownedPerks.length),
  ];
  const lossPool = merged.filter((p) => isFlatMoneyLossPrize(p.prize));
  const minFlatLoss = Math.min(sliceCount, Math.max(3, Math.ceil(sliceCount * 0.55)));
  const picked: PrizeCatalogId[] = pickUniqueFromPool(rng, lossPool, minFlatLoss);
  const used = new Set(picked);
  const filler = merged.filter((p) => !used.has(p.prize as PrizeCatalogId));
  if (picked.length < sliceCount) {
    const rest = pickUniqueFromPool(rng, filler, sliceCount - picked.length);
    for (const id of rest) {
      if (!used.has(id)) {
        used.add(id);
        picked.push(id);
      }
    }
  }
  while (picked.length < sliceCount && merged.length > 0) {
    const item = pickWeighted(rng, merged);
    const id = item.prize as PrizeCatalogId;
    if (!used.has(id)) {
      used.add(id);
      picked.push(id);
    }
  }
  return slotsFromPrizes(picked.slice(0, sliceCount), landShapeForFinalWheel(sliceCount));
}

export function buildPrizeSlotsForWheel(
  configId: WheelConfigId,
  options: BuildWheelPrizeOptions
): WheelPrizeSlot[] {
  const {
    runId,
    cycle,
    ownedPerks = [],
    advancements = [],
    banishedPrizes = [],
    permanentWedgeBonus = 0,
    wheelLaserCuts = {},
    wheelInsureCuts = {},
  } = options;
  const poolCycle =
    getCycleAdvancement(cycle).effectivePoolCycle + getAdvancementPoolCycleBonus(advancements);
  const seed = wheelLayoutSeed(runId, cycle, configId);
  const rng = mulberry32(seed);
  const banished = banishedPrizes ?? [];
  const laserCuts = wheelLaserCuts[configId] ?? 0;
  const insureCuts = wheelInsureCuts[configId] ?? 0;
  const n = sliceCountFor(configId, cycle, advancements, permanentWedgeBonus, laserCuts, insureCuts);

  switch (configId) {
    case "wheel_1":
      return buildMoneyWheel(cycle, advancements, banished, n);
    case "wheel_2":
      return buildPercentWheel(cycle, advancements, banished, n);
    case "wheel_3":
      return buildPoolWheel(RISK_POOL, poolCycle, rng, n, true, banished);
    case "wheel_4":
      return buildPerkWheel(poolCycle, ownedPerks, advancements, banished, rng, n);
    case "wheel_5":
      return buildPoolWheel(DRAIN_POOL, poolCycle, rng, n, true, banished);
    case "wheel_6":
      return buildPoolWheel(LUCKY_POOL, poolCycle, rng, n, false, banished);
    case "wheel_7": {
      const base = [...BUILDER_WEDGE_PRIZES] as PrizeCatalogId[];
      const prizes = [...base];
      while (prizes.length < n) {
        prizes.push(base[Math.floor(rng() * base.length)]!);
      }
      return slotsFromPrizes(prizes, landShapeForSliceCount(prizes.length, false));
    }
    case "wheel_8":
      return buildPoolWheel(CHAOS_POOL, poolCycle, rng, n, true, banished);
    case "wheel_9":
      return buildFinalWheel(poolCycle, ownedPerks, banished, rng, n);
    default:
      return buildMoneyWheel(cycle, advancements, banished, n);
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
