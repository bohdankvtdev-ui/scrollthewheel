/**
 * SpinWheel GDD — money roguelike (Balatro-inspired, no fantasy).
 * Formulas + pacing constants. Full design doc: `docs/GDD.md`.
 */

import type { WheelArchetype } from "./wheels/types";

export const GDD_PACING = {
  targetMinutesAverage: 18,
  targetMinutesSkilled: 30,
  wheelsPerCycle: 9,
  secondsPerWheelEstimate: 45,
  cyclesPerAverageRun: 2,
  cyclesPerSkilledRun: 5,
} as const;

export type RunEffectId =
  | "debt_bomb"
  | "lock_drain"
  | "boss_ghost"
  | "corruption_spread"
  | "doom_spiral";

export const RUN_EFFECT_LABELS: Record<RunEffectId, string> = {
  debt_bomb: "Debt Bomb — lose 30% money + curse",
  lock_drain: "Lock — next wheel forced to Drain",
  boss_ghost: "Boss Ghost — negatives +20% this cycle",
  corruption_spread: "Corruption — next 3 wheels get extra reds",
  doom_spiral: "Doom Spiral — upcoming wheels forced to Chaos",
};

/** What each prize family does in the money loop */
export const PRIZE_TAXONOMY = {
  money: "Instant cash — run shop currency",
  money_loss: "Cash hit — blocked by shields",
  bank_cut: "Percent of bank lost — high stakes",
  bank_wipe: "All-in risk — shield or bust",
  perk: "Persistent run upgrade (tap loadout to read)",
  debuff: "Negative modifier until cleared",
  relic_offer: "Passive relic — weighted spins / economy",
  deck_add: "Casino chip — passive modifier in chip row",
  deck_remove: "Burn last chip — trim weak passives",
  deck_upgrade: "Upgrade chip tier",
  neutral: "No effect — breathing room on harsh wheels",
  booster: "Small cash bump — filler on early wheels",
  run_effect: "Meta slice — applies temporary run rules",
} as const;

export type PerkTier = 0 | 1 | 2 | 3;

export const PERK_TIER_LABELS: Record<PerkTier, string> = {
  0: "Starter",
  1: "Core",
  2: "Power",
  3: "Capstone",
};

export type CycleParams = {
  cycleLevel: number;
  negativeSliceInject: number;
  shopPriceMult: number;
  luckyWeightMult: number;
  globalNegativeBias: number;
  riskWheelIndices: number[];
  doubleBossWheel: boolean;
};

/** Escalation after each boss clear (cycle 2–5+). */
export function getCycleParams(cycleLevel: number): CycleParams {
  const c = Math.max(1, cycleLevel);
  return {
    cycleLevel: c,
    negativeSliceInject: c >= 2 ? 2 : 0,
    shopPriceMult: 1 + (c - 1) * 0.12,
    luckyWeightMult: c >= 2 ? Math.max(0.75, 1 - (c - 1) * 0.06) : 1,
    globalNegativeBias: (c - 1) * 0.04 + (c >= 2 ? 0.08 : 0),
    riskWheelIndices: c >= 3 ? [1, 5] : [],
    doubleBossWheel: c >= 4,
  };
}

/** Optional cycle-end bonus — not required to advance */
export function getBlindQuota(cycleLevel: number, perkIds: string[] = []): number {
  const f = Math.max(1, cycleLevel);
  const base = 180 + f * 140 + Math.floor(Math.pow(f - 1, 1.25) * 60);
  if (perkIds.includes("ante_insurance")) return Math.floor(base * 0.88);
  return base;
}

/** Bonus meta chips when bank meets cycle bonus at boss clear */
export function getCycleBonusChips(cycleLevel: number): number {
  return 8 + cycleLevel * 4;
}

/** Each wheel in the cycle gets slightly nastier — stacks with cycle scaling */
export function getWheelDifficultyBias(wheelIndex: number, cycleLevel: number): number {
  const idx = Math.max(0, wheelIndex);
  const f = Math.max(1, cycleLevel);
  return idx * 0.035 * (1 + (f - 1) * 0.12);
}

export const GDD_LOOP_SUMMARY = {
  hook: "Start with bank cash. Spin 9 wheels per cycle; stack perks; beat the boss wheel to advance.",
  lose: "Bank hits $0 — run over.",
  win: "Survive wheel 9 → cycle bonus chips → harder next cycle.",
  chipsNote:
    "Chips are earned each spin and spent in the joker shop. Money is bank for wheel outcomes.",
} as const;

/** Config id for a forced archetype override (e.g. Lock → drain wheel) */
export function getConfigIdForArchetype(archetype: WheelArchetype): string | null {
  const map: Partial<Record<WheelArchetype, string>> = {
    drain: "wheel_5",
    chaos: "wheel_8",
    lucky: "wheel_6",
    money: "wheel_1",
  };
  return map[archetype] ?? null;
}
