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
  | "doom_spiral"
  | "boss_perk_tax"
  | "boss_overhead"
  | "boss_shield_break"
  | "boss_chip_cache"
  | "boss_golden_seal";

export const RUN_EFFECT_LABELS: Record<RunEffectId, string> = {
  debt_bomb: "Debt Bomb — lose 30% bank + curse",
  lock_drain: "Locked — next spin is Drain wheel",
  boss_ghost: "Boss Ghost — more bad slices this cycle",
  corruption_spread: "Corruption — 3 wheels get extra losses",
  doom_spiral: "Doom Spiral — next wheels are Chaos",
  boss_perk_tax: "Joker Tax — lose 5% bank per joker you own",
  boss_overhead: "Table Fee — lose 12% of bank",
  boss_shield_break: "Shield Break — lose 1 shield or 15% bank",
  boss_chip_cache: "Chip Cache — +shop chips (scales with cycle)",
  boss_golden_seal: "Golden Seal — +$ bank & +1 shield",
};

/** What each prize family does in the money loop */
export const PRIZE_TAXONOMY = {
  money: "+$ to your bank",
  money_loss: "−$ from bank (shield blocks once)",
  bank_cut: "Lose % of bank",
  bank_wipe: "Lose all bank $ (shield blocks once)",
  perk: "Free joker for your loadout",
  debuff: "Bad effect until cleared",
  relic_offer: "Passive relic — always on",
  deck_add: "Passive chip in your row",
  deck_remove: "Remove last chip",
  deck_upgrade: "Upgrade your best chip",
  neutral: "No change — safe slice",
  booster: "Small +$ bump",
  run_effect: "Special rule this cycle",
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
    negativeSliceInject: c >= 2 ? 2 : c === 1 ? 1 : 0,
    shopPriceMult: 1 + (c - 1) * 0.1 + (c >= 3 ? (c - 2) * 0.03 : 0),
    luckyWeightMult: c >= 2 ? Math.max(0.72, 1 - (c - 1) * 0.055) : 1,
    globalNegativeBias:
      (c === 1 ? 0.05 : 0) + (c - 1) * 0.045 + (c >= 2 ? 0.06 : 0),
    riskWheelIndices: c >= 3 ? [1, 5] : c === 2 ? [1] : [],
    doubleBossWheel: c >= 3,
  };
}

/** Each wheel in the cycle gets slightly nastier — stacks with cycle scaling */
export function getWheelDifficultyBias(wheelIndex: number, cycleLevel: number): number {
  const idx = Math.max(0, wheelIndex);
  const f = Math.max(1, cycleLevel);
  return idx * 0.035 * (1 + (f - 1) * 0.12);
}

export const GDD_LOOP_SUMMARY = {
  hook: "Start at $0. Spin 9 wheels per cycle; buy jokers and forge upgrades with chips.",
  lose: "Bank hits $0 — run over.",
  win: "Clear wheel 9 → next cycle hits harder.",
  chipsNote:
    "Chips = shop currency per run. Bank $ = wedge payouts. Win streaks earn bonus chips and cash.",
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
