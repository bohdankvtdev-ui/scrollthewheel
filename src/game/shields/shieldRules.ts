import type { RunState, SliceDefinition } from "../../schemas";
import { computeSliceMoneyDelta } from "../../utils/sliceMoneyDisplay";

/** Perks that grant shields without using a perk slot (`run.shieldPerks` for loadout). */
export const SHIELD_GRANT_PERK_IDS = new Set(["iron_reserve", "safe_harbor"]);

export function getLoadoutPerkIds(run: Pick<RunState, "perks" | "shieldPerks">): string[] {
  const perks = run.perks.filter((id) => !SHIELD_GRANT_PERK_IDS.has(id));
  return [...perks, ...(run.shieldPerks ?? [])];
}

export function hasShieldProtection(run: Pick<RunState, "shields" | "perks">): boolean {
  return (run.shields ?? 0) > 0;
}

export function hasSafeHarbor(run: RunState): boolean {
  return run.runEffects?.safeHarborActive === true || run.perks.includes("safe_harbor");
}

export function isMoneyLossSlice(slice: SliceDefinition): boolean {
  const { payload, kind } = slice;
  if (payload.wipeBank || kind === "bank_wipe") return true;
  if (payload.bankPercent != null && payload.bankPercent < 0) return true;
  if (payload.moneyDelta != null && payload.moneyDelta < 0) return true;
  return false;
}

export function wouldRunShieldBlockLoss(
  run: RunState,
  slice: SliceDefinition,
  wheelIndex: number
): boolean {
  if (!hasShieldProtection(run)) return false;
  if (isMoneyLossSlice(slice)) return true;
  return computeSliceMoneyDelta(run, slice, wheelIndex) < 0;
}

export function isShieldGrantPerk(perkId: string): boolean {
  return SHIELD_GRANT_PERK_IDS.has(perkId);
}

/** Shop tree prereqs — iron_reserve counts as owned once you have any shield. */
export function meetsShopPerkRequirement(run: RunState, requiredPerkId: string): boolean {
  if (requiredPerkId === "iron_reserve") {
    return hasShieldProtection(run) || run.perks.includes("iron_reserve");
  }
  if (requiredPerkId === "safe_harbor") {
    return hasSafeHarbor(run) || run.perks.includes("safe_harbor");
  }
  return run.perks.includes(requiredPerkId);
}
