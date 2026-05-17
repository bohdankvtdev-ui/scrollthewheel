import { SHOP_PERK_TREE, type ShopPerkNode } from "../loop";
import type { RunState } from "../../schemas";
import { BALATRO_ECONOMY } from "../balatroEconomy";
import { shopChipCost } from "./chipEconomy";
import { countJokers, isJokerSlotFull } from "./jokerSlots";

function seedFromRun(run: RunState, salt: number): number {
  let h = salt;
  const key = `${run.runId}:${run.history.length}:${run.floor}:${run.wheelIndex}`;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nodeAvailable(run: RunState, node: ShopPerkNode): boolean {
  if (node.perkId === "extra_slice" || node.perkId === "slice_expander") {
    return false;
  }
  if (run.perks.includes(node.perkId)) return false;
  if (isJokerSlotFull(run)) return false;
  for (const req of node.requires) {
    if (!run.perks.includes(req)) {
      return false;
    }
  }
  return true;
}

/** Deterministic shop row — reroll by bumping salt. */
export function pickShopOfferIds(
  run: RunState,
  count = BALATRO_ECONOMY.shopOfferCount,
  rerollSalt = 0
): string[] {
  const pool = SHOP_PERK_TREE.filter((n) => nodeAvailable(run, n));
  if (pool.length === 0) return [];

  const rng = mulberry32(seedFromRun(run, rerollSalt));
  const shuffled = [...pool].sort(() => rng() - 0.5);
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const node of shuffled) {
    if (seen.has(node.perkId)) continue;
    seen.add(node.perkId);
    ids.push(node.perkId);
    if (ids.length >= count) break;
  }

  return ids;
}

export function shopRerollCost(run: RunState, rerollsThisVisit: number): number {
  const base = BALATRO_ECONOMY.shopRerollBaseCost + rerollsThisVisit * 2;
  return shopChipCost(run, base);
}

export function sellRefundAmount(baseCost: number): number {
  return Math.max(1, Math.floor(baseCost * BALATRO_ECONOMY.sellRefundRatio));
}

export { countJokers };
