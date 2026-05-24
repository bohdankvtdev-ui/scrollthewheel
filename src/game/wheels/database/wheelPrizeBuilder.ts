import { getSliceCountForWheelWithBonus, LASER_MIN_SLICE_COUNT } from "../sliceCapacityBonus";
import { landShapeForSliceCount } from "./prizeRng";
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { WheelConfigId, WheelPrizeSlot } from "./types";
import { getAdvancementPoolCycleBonus } from "../../advancements/applyAdvancements";
import { getCycleAdvancement } from "../../effects/cycleAdvancement";
import {
  distributeLandChances,
  mulberry32,
  pickWeighted,
  shuffleInPlace,
  wheelLayoutSeed,
} from "./prizeRng";
import { NOTHING_PRIZE_ID } from "./wheelNothing";
import {
  applyBossAuditToPool,
  FINAL_LAND_SHAPE,
  type BossCycleAudit,
} from "../../boss/bossWheel";
import {
  LATE_CYCLE_MIN,
  LATE_CYCLE_PERK_HARM,
  mergeLateCycleSpikes,
} from "./lateCycleEvents";
import {
  BUILDER_WEDGE_PRIZES,
  CHAOS_POOL,
  FINAL_WHEEL_POOL,
  DRAIN_LAND_SHAPE,
  DRAIN_POOL,
  LAND_SHAPE_6_EVEN,
  LAND_SHAPE_LUCKY,
  LUCKY_POOL,
  MONEY_TIER_PRIZES,
  MONEY_TIER_WEIGHTS,
  MONEY_WHEEL_CYCLE1_POOL,
  PERK_WHEEL_POOL,
  RISK_BAD_POOL,
  RISK_GOOD_POOL,
  type PoolPick,
} from "./wheelPrizePools";
import { layoutWithNothing } from "./wheelNothing";

const LATE_PERK_PRIZES = new Set<PrizeCatalogId>([
  "perk_compounder",
  "perk_coupon_king",
  "perk_final_tax_shield",
  "perk_hex_ward",
  "perk_money_stream",
]);

const EARLY_PERK_BOOST = new Set<PrizeCatalogId>([
  "perk_lucky_money",
  "perk_lucky_percent",
  "perk_lucky_streak",
  "perk_lucky_perk",
  "perk_green_fever",
  "perk_gold_rush",
  "perk_iron_reserve",
  "perk_ante_insurance",
  "perk_chip_drip",
]);

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
  /** Wheels 1–8 results — tailors boss pool when rebuilding wheel 9. */
  bossCycleAudit?: BossCycleAudit;
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
  const rng = mulberry32(wheelLayoutSeed("money", cycle, "wheel_1"));

  if (cycle <= 1) {
    const pool = filterPool(MONEY_WHEEL_CYCLE1_POOL, cycle, banished);
    const picked = pickUniqueFromPool(rng, pool, n);
    const laid = layoutWithNothing(picked, "wheel_1", cycle, n, rng);
    return slotsFromPrizes(laid, LAND_SHAPE_LUCKY.slice(0, n));
  }

  const base: PoolPick[] = MONEY_TIER_PRIZES.map((t) => ({
    prize: t.prize,
    weight: MONEY_TIER_WEIGHTS[t.prize] ?? 10,
  }));
  const pool: PoolPick[] = cycle >= 4 ? mergeLateCycleSpikes(base) : base;
  const picked = pickUniqueFromPool(rng, filterPool(pool, cycle, banished), n);
  const laid = layoutWithNothing(picked, "wheel_1", cycle, n, rng);
  return slotsFromPrizes(laid, landShapeForSliceCount(n, false));
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
  const extra: PrizeCatalogId[] = ["bank_loss_30", "bank_gain_30"];
  if (cycle >= 4) extra.push("bank_loss_40", "bank_gain_40");
  if (cycle >= 5) extra.push("bank_double");
  return [...PERCENT_WHEEL_CYCLE1, ...extra];
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
  const picked = layoutWithNothing(
    pickUniqueFromPool(rng, pool, n),
    "wheel_2",
    cycle,
    n,
    rng
  );
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
    if (cycle < 3 && LATE_PERK_PRIZES.has(id)) return false;
    const pid = catalogPerkId(id);
    return (pid == null || !ownedPerks.includes(pid)) && !banished.includes(id);
  });
  const harm = filterPool(LATE_CYCLE_PERK_HARM, cycle, banished);
  const tierBias: PoolPick[] = [
    ...(pool.length > 0 ? pool : PERK_WHEEL_POOL).map((id) => {
      let weight = 8;
      if (EARLY_PERK_BOOST.has(id) && cycle <= 2) weight = 10;
      if (id.includes("compounder") || id.includes("coupon")) weight = cycle < 3 ? 3 : 7;
      return { prize: id, weight };
    }),
    ...harm,
  ];
  const picked = layoutWithNothing(
    pickUniqueFromPool(rng, tierBias, n),
    "wheel_4",
    cycle,
    n,
    rng
  );
  return slotsFromPrizes(picked, landShapeForSliceCount(n, false));
}

function isRiskGoodPrize(prizeId: PrizeCatalogId): boolean {
  if (prizeId === NOTHING_PRIZE_ID) return false;
  const def = PRIZE_CATALOG[prizeId];
  if (def == null) return false;
  if (def.kind === "money") return true;
  if (def.kind === "bank_cut") {
    const pct = def.payload?.bankPercent;
    return typeof pct === "number" && pct > 0;
  }
  return false;
}

function landChancesForHalf(count: number, targetSum: number): number[] {
  if (count <= 0) return [];
  const shape = landShapeForSliceCount(count, false).slice(0, count);
  const base = distributeLandChances(shape.length === count ? shape : [...shape, ...Array(count - shape.length).fill(10)]);
  const sum = base.reduce((a, b) => a + b, 0);
  const scaled = base.map((w) => Math.max(1, Math.round((w / sum) * targetSum)));
  let delta = targetSum - scaled.reduce((a, b) => a + b, 0);
  let i = 0;
  while (delta !== 0 && i < 200) {
    const idx = i % scaled.length;
    if (delta > 0) {
      scaled[idx] = (scaled[idx] ?? 1) + 1;
      delta -= 1;
    } else if ((scaled[idx] ?? 1) > 1) {
      scaled[idx] = (scaled[idx] ?? 1) - 1;
      delta += 1;
    }
    i += 1;
  }
  return scaled;
}

function slotsFromRiskHalves(prizes: PrizeCatalogId[]): WheelPrizeSlot[] {
  const good: PrizeCatalogId[] = [];
  const bad: PrizeCatalogId[] = [];
  for (const id of prizes) {
    if (isRiskGoodPrize(id)) good.push(id);
    else bad.push(id);
  }
  const goodChances = landChancesForHalf(good.length, 50);
  const badChances = landChancesForHalf(bad.length, 50);
  const chanceByPrize = new Map<string, number>();
  good.forEach((id, i) => chanceByPrize.set(id, goodChances[i]!));
  bad.forEach((id, i) => chanceByPrize.set(id, badChances[i]!));
  return prizes.map((prize) => ({
    prize,
    chance: chanceByPrize.get(prize) ?? Math.floor(100 / prizes.length),
  }));
}

function buildRiskWheel(
  cycle: number,
  rng: () => number,
  sliceCount: number,
  banished: string[],
  configId: FloorWheelOrderId
): WheelPrizeSlot[] {
  const goodPool = filterPool(mergeLateCycleSpikes(RISK_GOOD_POOL), cycle, banished);
  const badPool = filterPool(mergeLateCycleSpikes(RISK_BAD_POOL), cycle, banished);
  const half = Math.floor(sliceCount / 2);

  const good = pickUniqueFromPool(rng, goodPool, half);
  const bad = pickUniqueFromPool(rng, badPool, sliceCount - half);
  const withNothing = layoutWithNothing([...good, ...bad], configId, cycle, sliceCount, rng);
  const slots = slotsFromRiskHalves(withNothing);
  return shuffleInPlace(rng, slots);
}

function buildPoolWheel(
  pool: PoolPick[],
  cycle: number,
  rng: () => number,
  sliceCount: number,
  harshFirst: boolean,
  banished: string[],
  configId: FloorWheelOrderId,
  landShape?: readonly number[]
): WheelPrizeSlot[] {
  const filtered = filterPool(mergeLateCycleSpikes(pool), cycle, banished);
  const picked = layoutWithNothing(
    pickUniqueFromPool(rng, filtered, sliceCount),
    configId,
    cycle,
    sliceCount,
    rng
  );
  const shape =
    landShape != null
      ? landShape.slice(0, sliceCount)
      : landShapeForSliceCount(sliceCount, harshFirst);
  return slotsFromPrizes(picked, shape);
}

function buildDrainWheel(
  poolCycle: number,
  rng: () => number,
  sliceCount: number,
  banished: string[],
  configId: FloorWheelOrderId
): WheelPrizeSlot[] {
  const filtered = filterPool(DRAIN_POOL, poolCycle, banished);
  let picked = pickUniqueFromPool(rng, filtered, sliceCount);
  let guard = 0;
  while (picked.length < sliceCount && filtered.length > 0 && guard < sliceCount * 24) {
    guard += 1;
    const item = pickWeighted(rng, filtered);
    picked.push(item.prize as PrizeCatalogId);
  }
  while (picked.length < sliceCount && picked.length > 0) {
    picked.push(picked[picked.length - 1]!);
  }
  const withNothing = layoutWithNothing(
    picked.slice(0, sliceCount),
    configId,
    poolCycle,
    sliceCount,
    rng
  );
  const shape =
    sliceCount <= DRAIN_LAND_SHAPE.length
      ? DRAIN_LAND_SHAPE.slice(0, sliceCount)
      : landShapeForSliceCount(sliceCount, true);
  return slotsFromPrizes(withNothing, shape);
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

/** Boss disc: flat −$; optional wipe / tiny pays only (no tax, bomb, or % cuts). */
function isBossWheelPrize(prize: string, poolCycle: number): boolean {
  if (isFlatMoneyLossPrize(prize)) return true;
  if (prize === "bank_wipe") return poolCycle >= LATE_CYCLE_MIN;
  if (prize === "neutral_nothing") return poolCycle >= 2;
  if (prize === "boss_pay_100") return poolCycle >= 3;
  if (prize === "boss_pay_150") return poolCycle >= LATE_CYCLE_MIN;
  return false;
}

function buildFinalWheel(
  poolCycle: number,
  _ownedPerks: string[],
  banished: string[],
  rng: () => number,
  sliceCount: number,
  audit?: BossCycleAudit
): WheelPrizeSlot[] {
  const allowed = filterPool(FINAL_WHEEL_POOL, poolCycle, banished).filter((p) =>
    isBossWheelPrize(p.prize, poolCycle)
  );
  const merged = applyBossAuditToPool(allowed, audit);
  const lossPool = merged.filter((p) => isFlatMoneyLossPrize(p.prize));
  const minFlatLoss = Math.min(sliceCount, Math.max(4, Math.ceil(sliceCount * 0.7)));
  const picked: PrizeCatalogId[] = pickUniqueFromPool(rng, lossPool, minFlatLoss);
  const used = new Set(picked);
  const filler = merged.filter(
    (p) => !used.has(p.prize as PrizeCatalogId) && isBossWheelPrize(p.prize, poolCycle)
  );
  if (picked.length < sliceCount) {
    const rest = pickUniqueFromPool(rng, filler, sliceCount - picked.length);
    for (const id of rest) {
      if (!used.has(id)) {
        used.add(id);
        picked.push(id);
      }
    }
  }
  let fillGuard = 0;
  const fillGuardMax = Math.max(sliceCount * 24, 32);
  while (picked.length < sliceCount && merged.length > 0 && fillGuard < fillGuardMax) {
    fillGuard += 1;
    const item = pickWeighted(rng, merged);
    const id = item.prize as PrizeCatalogId;
    if (!used.has(id)) {
      used.add(id);
      picked.push(id);
    } else {
      // +1 wedge rebuild can need more rows than unique boss prizes — allow repeats.
      picked.push(id);
    }
  }
  while (picked.length < sliceCount) {
    const fallback =
      picked[picked.length - 1] ??
      (merged[0]?.prize as PrizeCatalogId | undefined) ??
      "money_loss_100_1";
    picked.push(fallback);
  }
  const withNothing = layoutWithNothing(
    picked.slice(0, sliceCount),
    "wheel_9",
    poolCycle,
    sliceCount,
    rng
  );
  return slotsFromPrizes(withNothing, landShapeForFinalWheel(sliceCount));
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
    bossCycleAudit,
  } = options;
  const poolCycle =
    getCycleAdvancement(cycle).effectivePoolCycle +
    getAdvancementPoolCycleBonus(advancements, cycle);
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
      return buildRiskWheel(poolCycle, rng, n, banished, "wheel_3");
    case "wheel_4":
      return buildPerkWheel(poolCycle, ownedPerks, advancements, banished, rng, n);
    case "wheel_5":
      return buildDrainWheel(poolCycle, rng, n, banished, "wheel_5");
    case "wheel_6":
      return buildPoolWheel(LUCKY_POOL, poolCycle, rng, n, false, banished, "wheel_6");
    case "wheel_7": {
      const base = [...BUILDER_WEDGE_PRIZES] as PrizeCatalogId[];
      const prizes = [...base];
      while (prizes.length < n) {
        prizes.push(base[Math.floor(rng() * base.length)]!);
      }
      const withNothing = layoutWithNothing(prizes, "wheel_7", cycle, n, rng);
      return slotsFromPrizes(withNothing, landShapeForSliceCount(withNothing.length, false));
    }
    case "wheel_8":
      return buildPoolWheel(CHAOS_POOL, poolCycle, rng, n, true, banished, "wheel_8");
    case "wheel_9":
      return buildFinalWheel(poolCycle, ownedPerks, banished, rng, n, bossCycleAudit);
    default:
      return buildMoneyWheel(cycle, advancements, banished, n);
  }
}
