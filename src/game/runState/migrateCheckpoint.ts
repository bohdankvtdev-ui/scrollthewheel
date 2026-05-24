import type { RunState } from "../../schemas";
import { normalizeRunState } from "./normalize";
import { WHEEL_DATABASE_REVISION } from "../wheels/database/wheelDatabase";
import { rebuildWheelsFromDatabase } from "../../systems/WheelSystem";

/** Normalize legacy checkpoints before hydrate or home preview. */
export function migrateRunCheckpoint(raw: RunState): RunState {
  const legacy = raw as RunState & { corruption?: number };
  let next = raw;
  if (legacy.corruption != null) {
    const { corruption: _removed, ...rest } = legacy;
    next = rest as RunState;
  }
  if (next.shields == null) next = { ...next, shields: 0 };
  if ("boss" in (next as RunState & { boss?: unknown })) {
    const { boss: _b, ...rest } = next as RunState & { boss?: unknown };
    next = rest as RunState;
  }
  if (next.pendingWheelRebuild == null) next = { ...next, pendingWheelRebuild: false };
  if (next.peakMoney == null) {
    next = { ...next, peakMoney: next.money ?? 0 };
  }
  if (next.floorsCleared == null) {
    next = { ...next, floorsCleared: Math.max(0, next.floor - 1) };
  }
  if (next.wheelDbRevision !== WHEEL_DATABASE_REVISION) {
    next = {
      ...rebuildWheelsFromDatabase(next),
      wheelDbRevision: WHEEL_DATABASE_REVISION,
    };
  }
  return normalizeRunState(next);
}
