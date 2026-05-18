import { BALATRO_ECONOMY } from "../balatroEconomy";
import type { RunState } from "../../schemas";

import { SHIELD_GRANT_PERK_IDS } from "../shields/shieldRules";

const SLICE_PERKS = new Set(["extra_slice", "slice_expander"]);

/** Perks in loadout slots (excludes slice upgrades and shield grants). */
export function countJokers(run: RunState): number {
  return run.perks.filter((id) => !SLICE_PERKS.has(id) && !SHIELD_GRANT_PERK_IDS.has(id)).length;
}

export function isJokerSlotFull(run: RunState): boolean {
  return countJokers(run) >= BALATRO_ECONOMY.maxJokerSlots;
}
