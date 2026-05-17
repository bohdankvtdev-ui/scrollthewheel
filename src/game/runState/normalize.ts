import type { RunPhase, RunState as SchemaRunState } from "../../schemas";

import { DEFAULT_RUN_MODIFIERS, type RunState } from "./types";



function normalizePhase(phase: RunPhase): RunPhase {

  if (phase === "lost_stability" || phase === "lost_instant") {

    return "lost_money";

  }

  return phase;

}



/** Ensure roguelike fields exist on hydrated checkpoints. */

export function normalizeRunState(raw: SchemaRunState): RunState {

  const { stability: _s, maxStability: _m, ...rest } = raw as SchemaRunState & {

    stability?: number;

    maxStability?: number;

  };



  return {

    ...rest,

    phase: normalizePhase(rest.phase),

    chipsEarnedThisRun: rest.chipsEarnedThisRun ?? 0,
    pressure: rest.pressure ?? 0,
    winStreak: rest.winStreak ?? 0,
    lossStreak: rest.lossStreak ?? 0,
    chipForge: rest.chipForge ?? {},

    modifiers: { ...DEFAULT_RUN_MODIFIERS, ...rest.modifiers },

    pendingJokerOffers: rest.pendingJokerOffers ?? [],

    runEffects: rest.runEffects ?? {},

    shields: rest.shields ?? 0,

    pendingWheelRebuild: rest.pendingWheelRebuild ?? false,
    advancements: rest.advancements ?? [],
  };

}
