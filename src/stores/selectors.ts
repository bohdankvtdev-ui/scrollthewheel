import type { RunState } from "../schemas";
import { WHEEL_COUNT } from "../data/wheels/runPipeline";

export function selectActiveWheel(run: RunState | null) {
  if (run == null) return null;
  return run.wheels[run.wheelIndex] ?? null;
}

export function selectCanSpin(run: RunState | null, isSpinning: boolean) {
  if (run == null || isSpinning) return false;
  return run.phase === "active" && run.money > 0;
}

export function selectWheelProgress(run: RunState | null) {
  if (run == null) return { current: 0, total: WHEEL_COUNT };
  return { current: run.wheelIndex + 1, total: WHEEL_COUNT };
}

export function selectUpgradeChips(run: RunState | null) {
  if (run == null) return [];
  const perks = run.perks.map((id) => ({ kind: "perk" as const, id }));
  const debuffs = run.debuffs.map((id) => ({ kind: "debuff" as const, id }));
  const relics = run.relics.map((id) => ({ kind: "relic" as const, id }));
  return [...perks, ...debuffs, ...relics];
}
