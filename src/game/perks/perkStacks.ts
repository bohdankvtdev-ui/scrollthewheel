import { BALATRO_ECONOMY } from "../balatroEconomy";
import type { RunState } from "../../schemas";
import { SHIELD_GRANT_PERK_IDS } from "../shields/shieldRules";

/** Max copies of one stackable perk / curse in a run. */
export const MAX_PERK_STACK = 5;

/** One-shot or capstone perks — only one copy, uses a slot once. */
export const UNIQUE_PERK_IDS = new Set([
  "curse_break",
  "purify_touch",
  "double_down",
  "iron_reserve",
  "safe_harbor",
]);

export type LoadoutStack = {
  id: string;
  count: number;
  kind: "perk" | "shield" | "debuff";
};

export function isStackablePerk(perkId: string): boolean {
  return (
    !UNIQUE_PERK_IDS.has(perkId) &&
    perkId !== "extra_slice" &&
    perkId !== "slice_expander"
  );
}

export function countPerkCopies(perks: string[], perkId: string): number {
  return perks.filter((id) => id === perkId).length;
}

export function countDebuffCopies(debuffs: string[], debuffId: string): number {
  return debuffs.filter((id) => id === debuffId).length;
}

/** Unique joker slots used (extra copies of a stackable perk share one slot). */
export function countUniqueJokerSlots(run: RunState): number {
  const seen = new Set<string>();
  for (const id of run.perks) {
    if (id === "extra_slice" || id === "slice_expander") continue;
    if (SHIELD_GRANT_PERK_IDS.has(id)) continue;
    seen.add(id);
  }
  return seen.size;
}

export function isJokerSlotFull(run: RunState): boolean {
  return countUniqueJokerSlots(run) >= BALATRO_ECONOMY.maxJokerSlots;
}

export function canAddPerkCopy(run: RunState, perkId: string): boolean {
  const copies = countPerkCopies(run.perks, perkId);
  if (!isStackablePerk(perkId)) {
    return copies === 0 && !isJokerSlotFull(run);
  }
  if (copies >= MAX_PERK_STACK) return false;
  if (copies === 0) return !isJokerSlotFull(run);
  return true;
}

/** True when perk should be hidden from shop buy list (sold via sell row). */
export function perkHiddenFromShop(run: RunState, perkId: string): boolean {
  if (!run.perks.includes(perkId)) return false;
  if (isStackablePerk(perkId)) {
    return countPerkCopies(run.perks, perkId) >= MAX_PERK_STACK;
  }
  return true;
}

/** Display order: oldest left → newest right; one icon per id with stack badge. */
export function getLoadoutStacks(run: RunState): LoadoutStack[] {
  const stacks: LoadoutStack[] = [];

  if ((run.shields ?? 0) > 0) {
    stacks.push({ id: "__shields__", count: run.shields ?? 0, kind: "shield" });
  }

  const perkOrder: string[] = [];
  for (const id of run.perks) {
    if (!perkOrder.includes(id)) perkOrder.push(id);
  }
  for (const id of run.shieldPerks ?? []) {
    if (!perkOrder.includes(id)) perkOrder.push(id);
  }
  for (const id of perkOrder) {
    const inPerks = countPerkCopies(run.perks, id);
    const count = inPerks > 0 ? inPerks : 1;
    stacks.push({ id, count, kind: "perk" });
  }

  const debuffOrder: string[] = [];
  for (const id of run.debuffs) {
    if (!debuffOrder.includes(id)) debuffOrder.push(id);
  }
  for (const id of debuffOrder) {
    stacks.push({ id, count: countDebuffCopies(run.debuffs, id), kind: "debuff" });
  }

  return stacks;
}

export function removeOnePerkCopy(run: RunState, perkId: string): RunState {
  const idx = run.perks.lastIndexOf(perkId);
  if (idx < 0) return run;
  const perks = [...run.perks];
  perks.splice(idx, 1);
  return { ...run, perks };
}

export function appendPerkCopy(run: RunState, perkId: string): RunState {
  return { ...run, perks: [...run.perks, perkId] };
}

export function appendDebuffCopy(run: RunState, debuffId: string): RunState {
  return { ...run, debuffs: [...run.debuffs, debuffId] };
}
