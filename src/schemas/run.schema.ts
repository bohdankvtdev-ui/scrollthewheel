import type { ResolvedWheel } from "./wheel.schema";
import type { SliceCount } from "./wheel.schema";

export type RunPhase = "active" | "won" | "lost_money" | "lost_blind" | "lost_boss";

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
  pendingJokerOffers?: string[];
  deck: string[];
  perks: string[];
  /** Blocks money-loss slices (Iron Reserve). */
  shields?: number;
  debuffs: string[];
  relics: string[];
  sliceCapacity: SliceCount;
  /** Cash required to clear this floor after all 9 wheels. */
  blindQuota: number;
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
