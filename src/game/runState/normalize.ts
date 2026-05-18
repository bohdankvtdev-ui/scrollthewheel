import type { RunPhase, RunState as SchemaRunState } from "../../schemas";

import { withTacticWheelIndices } from "../tactics/tacticWheels";
import { DEFAULT_RUN_MODIFIERS, type RunState } from "./types";



function normalizePhase(phase: RunPhase): RunPhase {

  if (phase === "lost_stability" || phase === "lost_instant") {

    return "lost_money";

  }

  return phase;

}



function backfillShieldPerks(run: SchemaRunState): string[] {
  const ids = [...(run.shieldPerks ?? [])];
  if (run.runEffects?.safeHarborActive === true && !ids.includes("safe_harbor")) {
    ids.push("safe_harbor");
  }
  return ids;
}

/** Ensure roguelike fields exist on hydrated checkpoints. */

export function normalizeRunState(raw: SchemaRunState): RunState {

  const { stability: _s, maxStability: _m, ...rest } = raw as SchemaRunState & {

    stability?: number;

    maxStability?: number;

  };



  let normalized: RunState = {

    ...rest,

    phase: normalizePhase(rest.phase),

    chipsEarnedThisRun: rest.chipsEarnedThisRun ?? 0,
    winStreak: rest.winStreak ?? 0,
    peakMoney: rest.peakMoney ?? rest.money ?? 0,
    chipForge: rest.chipForge ?? {},
    inventory: rest.inventory ?? { wedgeEraser: 0 },
    banishedPrizes: rest.banishedPrizes ?? {},
    wheelLaserCuts: rest.wheelLaserCuts ?? {},
    wheelInsureCuts: rest.wheelInsureCuts ?? {},

    modifiers: { ...DEFAULT_RUN_MODIFIERS, ...rest.modifiers },

    pendingJokerOffers: rest.pendingJokerOffers ?? [],

    runEffects: rest.runEffects ?? {},

    shields: rest.shields ?? 0,

    shieldPerks: backfillShieldPerks(rest),

    pendingWheelRebuild: rest.pendingWheelRebuild ?? false,
    permanentWedgeBonus: rest.permanentWedgeBonus ?? 0,
    advancements: rest.advancements ?? [],
  };

  if (
    normalized.phase === "active" &&
    (normalized.runEffects?.tacticWheelIndices == null ||
      normalized.runEffects.tacticWheelIndices.length === 0)
  ) {
    normalized = withTacticWheelIndices(normalized);
  }

  return normalized;

}
