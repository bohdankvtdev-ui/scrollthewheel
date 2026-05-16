/**
 * SpinWheel GDD — money roguelike (Balatro-inspired, no fantasy).
 * Formulas + pacing constants. Full design doc: `docs/GDD.md`.
 * Icons: `src/game/content/iconRegistry.ts`.
 */

export const GDD_PACING = {
  /** Target ~10 min average @ ~45s per wheel × 9 wheels × ~1.5 floors */
  targetMinutesAverage: 10,
  targetMinutesSkilled: 18,
  wheelsPerFloor: 10,
  secondsPerWheelEstimate: 45,
  floorsPerAverageRun: 1.5,
  floorsPerSkilledRun: 3,
} as const;

/** What each prize family does in the money loop */
export const PRIZE_TAXONOMY = {
  money: "Instant cash — primary scoring resource",
  money_loss: "Cash hit — blocked by shields",
  bank_cut: "Percent of bank lost — high stakes",
  bank_wipe: "All-in risk — shield or bust",
  perk: "Persistent run upgrade (tap loadout to read)",
  debuff: "Negative modifier until cleared",
  relic_offer: "Passive relic — weighted spins / economy",
  deck_add: "Casino chip — passive modifier in chip row",
  deck_remove: "Burn last chip — trim weak passives",
  deck_upgrade: "Upgrade chip tier — copper → die → wide",
  neutral: "No effect — breathing room on harsh wheels",
  booster: "Small cash bump — filler on early wheels",
} as const;

export type PerkTier = 0 | 1 | 2 | 3;

export const PERK_TIER_LABELS: Record<PerkTier, string> = {
  0: "Starter",
  1: "Core",
  2: "Power",
  3: "Capstone",
};

/** End-of-ante cash target — clear all wheels then hit this bank (Balatro blind). */
export function getBlindQuota(floor: number, perkIds: string[] = []): number {
  const f = Math.max(1, floor);
  const base = 180 + f * 140 + Math.floor(Math.pow(f - 1, 1.25) * 60);
  if (perkIds.includes("ante_insurance")) return Math.floor(base * 0.88);
  return base;
}

/** Each wheel in the floor gets slightly nastier — stacks with floor scaling */
export function getWheelDifficultyBias(wheelIndex: number, floor: number): number {
  const idx = Math.max(0, wheelIndex);
  const f = Math.max(1, floor);
  return idx * 0.035 * (1 + (f - 1) * 0.12);
}

export const GDD_LOOP_SUMMARY = {
  hook: "Start at $0. Spin 10 wheels per ante; shop after each spin; stack jokers; beat the blind.",
  lose: "Debt ($ below 0) or miss the blind target after the boss wheel.",
  win: "Beat blind → interest bonus → next ante with harder wheels & higher target.",
  chipsNote:
    "Chips are meta score (this run starts at 0). Money is shop currency. Mods in the chip row bias spins.",
} as const;
