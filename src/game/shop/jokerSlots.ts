import { BALATRO_ECONOMY } from "../balatroEconomy";
import type { RunState } from "../../schemas";

const SLICE_PERKS = new Set(["extra_slice", "slice_expander"]);

/** Jokers = perks that are not slice-capacity upgrades. */
export function countJokers(run: RunState): number {
  return run.perks.filter((id) => !SLICE_PERKS.has(id)).length;
}

export function isJokerSlotFull(run: RunState): boolean {
  return countJokers(run) >= BALATRO_ECONOMY.maxJokerSlots;
}
