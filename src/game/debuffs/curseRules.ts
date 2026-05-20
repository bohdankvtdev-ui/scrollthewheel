import type { RunState } from "../../schemas";

const HEX_WARD_RESIST_CHANCE = 0.3;

/** True when a new curse wedge should be ignored (Hex Ward). */
export function rollCurseResisted(run: RunState): boolean {
  if (!run.perks.includes("hex_ward")) return false;
  return Math.random() < HEX_WARD_RESIST_CHANCE;
}

export function removeOldestCurse(run: RunState): RunState {
  if (run.debuffs.length === 0) return run;
  return { ...run, debuffs: run.debuffs.slice(1) };
}

export function removeAllCurses(run: RunState): RunState {
  if (run.debuffs.length === 0) return run;
  return { ...run, debuffs: [] };
}
