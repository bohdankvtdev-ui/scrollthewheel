import type { RunState } from "../../schemas";
import { WHEEL_COUNT } from "../loop";

/** ~3 of 9 wheels per cycle show a tactic decision. */
export const TACTIC_WHEELS_PER_CYCLE = 3;

function hashSeed(runId: string, floor: number): number {
  const s = `${runId}:tactic:${floor}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cycle 1 wheels 1–2: no tactic prompts (player lacks chips early). */
export function isTacticWheelEligible(run: RunState, wheelIndex: number): boolean {
  if (run.floor === 1 && wheelIndex < 2) return false;
  return isTacticDecisionWheel(run, wheelIndex);
}

/** Pick exactly `TACTIC_WHEELS_PER_CYCLE` distinct wheel indices for this cycle. */
export function rollTacticWheelIndices(runId: string, floor: number): number[] {
  const rng = mulberry32(hashSeed(runId, floor));
  let pool = Array.from({ length: WHEEL_COUNT }, (_, i) => i);
  if (floor === 1) {
    pool = pool.filter((i) => i >= 2);
  }
  const picked: number[] = [];
  while (picked.length < TACTIC_WHEELS_PER_CYCLE && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    picked.push(pool.splice(i, 1)[0]!);
  }
  return picked.sort((a, b) => a - b);
}

export function isTacticDecisionWheel(run: RunState, wheelIndex: number): boolean {
  const indices = run.runEffects?.tacticWheelIndices;
  if (indices == null || indices.length === 0) return false;
  return indices.includes(wheelIndex);
}

export function withTacticWheelIndices(run: RunState): RunState {
  return {
    ...run,
    runEffects: {
      ...run.runEffects,
      tacticWheelIndices: rollTacticWheelIndices(run.runId, run.floor),
    },
  };
}
