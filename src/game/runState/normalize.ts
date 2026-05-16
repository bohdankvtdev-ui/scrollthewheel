import type { RunState as SchemaRunState } from "../../schemas";
import { DEFAULT_RUN_MODIFIERS, type RunState } from "./types";

/** Ensure roguelike fields exist on hydrated checkpoints. */
export function normalizeRunState(raw: SchemaRunState): RunState {
  return {
    ...raw,
    chipsEarnedThisRun: raw.chipsEarnedThisRun ?? 0,
    modifiers: { ...DEFAULT_RUN_MODIFIERS, ...raw.modifiers },
    pendingJokerOffers: raw.pendingJokerOffers ?? [],
    shields: raw.shields ?? 0,
    pendingWheelRebuild: raw.pendingWheelRebuild ?? false,
  };
}
