import type { ResolvedWheel } from "./wheel.schema";
import type { SliceCount } from "./wheel.schema";

export type RunPhase =
  | "active"
  | "won"
  | "lost_money"
  | "lost_blind"
  | "lost_boss";

export type SpinEvent = {
  wheelIndex: number;
  sliceId: string;
  floor: number;
  ts: number;
};

/** @see `game/runState/types.ts` — full roguelike extensions. */
export type RunModifiersPersisted = {
  moneyGainMult?: number;
  moneyLossMult?: number;
  rareWeightMult?: number;
  chipGainMult?: number;
  /** +% bank from percent wheel gains (chip forge). */
  percentGainMult?: number;
};

export type ChipForgeLevels = Partial<
  Record<
    | "forge_cash"
    | "forge_guard"
    | "forge_chips"
    | "forge_percent"
    | "forge_barrier"
    | "forge_hot",
    number
  >
>;

/** Temporary rules from complexity slices (Lock, Corruption, Doom Spiral, …). */
export type RunEffectsPersisted = {
  forcedArchetypeByIndex?: Record<number, string>;
  negativeBiasBonus?: number;
  corruptionRemainingWheels?: number;
  doomSpiralRemainingWheels?: number;
  debtShieldUsedThisCycle?: boolean;
  softLandingUsedThisCycle?: boolean;
  ironGritUsed?: boolean;
};

export type RunState = {
  runId: string;
  phase: RunPhase;
  floor: number;
  wheelIndex: number;
  money: number;
  /** Meta chips earned this run (global score; not spendable in-run). */
  chipsEarnedThisRun?: number;
  modifiers?: RunModifiersPersisted;
  runEffects?: RunEffectsPersisted;
  pendingJokerOffers?: string[];
  deck: string[];
  perks: string[];
  /** Shop-bought run upgrades (slice inject, cycle bonuses, …). */
  advancements?: string[];
  /** Repeatable chip-forge levels (in-run shop). */
  chipForge?: ChipForgeLevels;
  forgeShieldsGranted?: number;
  /** Consecutive winning spins — chip/cash bonuses only. */
  winStreak?: number;
  /** Highest bank $ reached this run (player record). */
  peakMoney?: number;
  /** Blocks money-loss slices (Iron Reserve). */
  shields?: number;
  debuffs: string[];
  relics: string[];
  sliceCapacity: SliceCount;
  /** Floors fully cleared before this one — for Compounder perk. */
  floorsCleared: number;
  /** Capacity bumped; rebuild wheels on next spin or wheel advance. */
  pendingWheelRebuild?: boolean;
  /** Next positive cash slice pays ×2 (Double Down perk). */
  doubleDownPending?: boolean;
  wheels: ResolvedWheel[];
  history: SpinEvent[];
  /** Matches `WHEEL_DATABASE_REVISION` — rebuild wheels when stale. */
  wheelDbRevision?: number;
  /** Consumables — tap in loadout, then tap a wedge to use. */
  inventory?: { wedgeEraser?: number };
  /** Prize catalog ids removed from specific wheels (player choice). */
  banishedPrizes?: Partial<Record<string, string[]>>;
  /** Last cycle reward shown on clear overlay. */
  lastCycleReward?: { cycle: number; chips: number; money: number };
};

export type InfiniteScalingParams = {
  floor: number;
  /** Floor tier label (e.g. Warm-Up Floor, Turbo Floor) */
  blindLabel: string;
  negativeWeightMult: number;
  stakesMult: number;
  moneyInflationMult: number;
  sliceCapacityBonus: number;
};

export const RUN_SCHEMA_VERSION = 1;
