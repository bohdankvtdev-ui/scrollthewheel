import type { RunPhase, RunState as SchemaRunState, SpinEvent } from "../../schemas";

export type { SchemaRunState };

/** Temporary run-wide multipliers (reset each run). */
export type RunModifiers = {
  moneyGainMult: number;
  moneyLossMult: number;
  rareWeightMult: number;
  chipGainMult: number;
};

export const DEFAULT_RUN_MODIFIERS: RunModifiers = {
  moneyGainMult: 1,
  moneyLossMult: 1,
  rareWeightMult: 1,
  chipGainMult: 1,
};

/** Extended run state — superset of persisted `RunState` with roguelike fields. */
export type RunState = SchemaRunState & {
  /** Meta chips earned this run (granted to global total on run end). */
  chipsEarnedThisRun: number;
  modifiers: RunModifiers;
  /** Joker ids offered on last wheel (shop-style pick — future UI). */
  pendingJokerOffers: string[];
};

export type RunEndResult = {
  phase: RunPhase;
  chipsAwarded: number;
  totalChipsAfter: number;
  floorReached: number;
};

export type { SpinEvent, RunPhase };
