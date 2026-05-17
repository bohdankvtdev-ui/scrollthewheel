import type { RunState } from "../../schemas";
import { BALATRO_ECONOMY } from "../balatroEconomy";
import { shopChipCost } from "../shop/chipEconomy";
import { ADVANCEMENT_CATALOG, SHOP_ADVANCEMENT_POOL } from "./advancementCatalog";

function seedFromRun(run: RunState, salt: number): number {
  let h = salt;
  const key = `${run.runId}:${run.history.length}:${run.floor}:adv:${run.wheelIndex}`;
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

export function pickShopAdvancementIds(
  run: RunState,
  count = BALATRO_ECONOMY.advancementOfferCount,
  rerollSalt = 0
): string[] {
  const owned = new Set(run.advancements ?? []);
  const pool = SHOP_ADVANCEMENT_POOL.filter((id) => !owned.has(id));
  if (pool.length === 0) return [];

  const rng = mulberry32(seedFromRun(run, rerollSalt + 9000));
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

export function advancementShopCost(run: RunState, advancementId: string): number {
  const def = ADVANCEMENT_CATALOG[advancementId];
  if (def == null) return 99;
  return shopChipCost(run, def.cost);
}
