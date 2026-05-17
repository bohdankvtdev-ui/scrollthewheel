import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import type { WheelConfigId, WheelPrizeSlot } from "./types";
import { SLICES_PER_WHEEL } from "./constants";
import { applyCycleEconomyToPayload, formatPrizeLabel } from "./cycleEconomy";
import { getAdvancementPoolCycleBonus } from "../../advancements";
import { getCycleAdvancement } from "../../effects/cycleAdvancement";
import { distributeLandChances, mulberry32, pickWeighted, wheelLayoutSeed } from "./prizeRng";
import {
  BUILDER_POOL,
  BOSS_POOL,
  CHAOS_POOL,
  DRAIN_POOL,
  LAND_SHAPE_6,
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
};

function filterPool(pool: PoolPick[], cycle: number): PoolPick[] {
  return pool.filter((p) => {
    if (p.minCycle != null && cycle < p.minCycle) return false;
    if (p.maxCycle != null && cycle > p.maxCycle) return false;
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

function slotsFromPrizes(
  prizes: PrizeCatalogId[],
  landShape: readonly number[]
): WheelPrizeSlot[] {
  const chances = distributeLandChances(landShape.slice(0, prizes.length));
  return prizes.map((prize, i) => ({
    prize,
    chance: chances[i] ?? Math.floor(100 / prizes.length),
  }));
}

const PERCENT_LAND_C1 = [24, 22, 18, 16, 12, 8] as const;
const PERCENT_LAND_C2 = [22, 24, 20, 14, 10, 10] as const;

/** Percent wheel — fixed identity (bank %); gains scale via cycleEconomy on payload */
function buildPercentWheel(cycle: number): WheelPrizeSlot[] {
  if (cycle >= 2) {
    return slotsFromPrizes(
      [
        "bank_cut_ten",
        "bank_cut_quarter",
        "bank_cut_half",
        "bank_cut_75",
        "bank_gain_4",
        "bank_gain_5",
      ],
      PERCENT_LAND_C2
    );
  }
  return slotsFromPrizes(
    [
      "bank_cut_ten",
      "bank_cut_quarter",
      "bank_cut_half",
      "bank_gain_4",
      "bank_gain_5",
      "bank_gain_7",
    ],
    PERCENT_LAND_C1
  );
}

/** Wheel 1 — mostly cash, one early tax wedge (~8% land). */
const MONEY_WHEEL_LAND = [26, 22, 18, 16, 12, 6] as const;

function buildMoneyWheel(): WheelPrizeSlot[] {
  const prizes: (typeof MONEY_TIER_PRIZES)[number]["prize"][] = [
    "money_30",
    "money_50",
    "money_80",
    "money_100",
    "money_120",
    "money_loss_40",
  ];
  return slotsFromPrizes(prizes, MONEY_WHEEL_LAND);
}

function catalogPerkId(prizeId: PrizeCatalogId): string | null {
  const def = PRIZE_CATALOG[prizeId];
  const pid = def?.payload?.perkId;
  return typeof pid === "string" ? pid : null;
}

function buildPerkWheel(cycle: number, ownedPerks: string[], rng: () => number): WheelPrizeSlot[] {
  const pool = PERK_WHEEL_POOL.filter((id) => {
    const pid = catalogPerkId(id);
    return pid == null || !ownedPerks.includes(pid);
  });
  if (pool.length === 0) {
    return slotsFromPrizes(
      ["perk_lucky_streak", "perk_gold_rush", "perk_iron_reserve", "perk_hot_table", "perk_high_roller", "perk_safe_harbor"],
      LAND_SHAPE_6_EVEN
    );
  }
  const tierBias: PoolPick[] = pool.map((id) => {
    const tier = id.includes("compounder") || id.includes("coupon") || id.includes("vip") ? 2 : 0;
    const weight = tier >= 2 && cycle < 2 ? 2 : tier === 0 ? 10 : 6;
    return { prize: id, weight };
  });
  const picked = pickUniqueFromPool(rng, tierBias, SLICES_PER_WHEEL);
  return slotsFromPrizes(picked, LAND_SHAPE_6_EVEN);
}

function buildPoolWheel(
  pool: PoolPick[],
  cycle: number,
  rng: () => number,
  landShape: readonly number[]
): WheelPrizeSlot[] {
  const filtered = filterPool(pool, cycle);
  const picked = pickUniqueFromPool(rng, filtered, SLICES_PER_WHEEL);
  return slotsFromPrizes(picked, landShape);
}

export function buildPrizeSlotsForWheel(
  configId: WheelConfigId,
  options: BuildWheelPrizeOptions
): WheelPrizeSlot[] {
  const { runId, cycle, ownedPerks = [], advancements = [] } = options;
  const poolCycle =
    getCycleAdvancement(cycle).effectivePoolCycle + getAdvancementPoolCycleBonus(advancements);
  const seed = wheelLayoutSeed(runId, cycle, configId);
  const rng = mulberry32(seed);

  switch (configId) {
    case "wheel_1":
      return buildMoneyWheel();
    case "wheel_2":
      return buildPercentWheel(cycle);
    case "wheel_3":
      return buildPoolWheel(RISK_POOL, poolCycle, rng, LAND_SHAPE_6);
    case "wheel_4":
      return buildPerkWheel(poolCycle, ownedPerks, rng);
    case "wheel_5":
      return buildPoolWheel(DRAIN_POOL, poolCycle, rng, LAND_SHAPE_6);
    case "wheel_6":
      return buildPoolWheel(LUCKY_POOL, poolCycle, rng, LAND_SHAPE_LUCKY);
    case "wheel_7":
      return buildPoolWheel(BUILDER_POOL, poolCycle, rng, LAND_SHAPE_6_EVEN);
    case "wheel_8":
      return buildPoolWheel(CHAOS_POOL, poolCycle, rng, LAND_SHAPE_6);
    case "wheel_9":
      return buildPoolWheel(BOSS_POOL, poolCycle, rng, LAND_SHAPE_LUCKY);
    default:
      return buildMoneyWheel();
  }
}

/** Apply cycle scaling + fresh labels after template copy */
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
