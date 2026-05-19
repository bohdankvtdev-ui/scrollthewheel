import { useMemo } from "react";
import type { ScrollWheelRound } from "../../features/cash-spin/reelStripModel";
import type { RunState } from "../schemas";
import type { SpinWheelItem } from "../../types/spin";
import { labelFromHistory } from "../game/tactics/wheelHubState";
import { LAST_WHEEL_INDEX } from "../game/cycle/cycleTransition";

export function buildRunReelRounds(
  run: RunState,
  awaitingClaim: boolean,
  lastResultLabel: string | null,
  gambleFlipActive: boolean,
  pendingBossCycleTransition = false
): ScrollWheelRound[] {
  const lastHistByWheel = new Map<number, (typeof run.history)[number]>();
  for (const h of run.history) {
    if (h.floor !== run.floor) continue;
    lastHistByWheel.set(h.wheelIndex, h);
  }
  return run.wheels.map((wheel, i) => {
      const hist = lastHistByWheel.get(i);
      const prizeFromHist: SpinWheelItem | null =
        hist != null
          ? {
              id: hist.sliceId,
              label: wheel.slices.find((s) => s.id === hist.sliceId)?.label ?? hist.sliceId,
            }
          : null;

      if (i < run.wheelIndex) {
        return { status: "claimed" as const, prize: prizeFromHist };
      }
      if (i === run.wheelIndex) {
        if (
          pendingBossCycleTransition &&
          i === LAST_WHEEL_INDEX &&
          (hist != null || awaitingClaim)
        ) {
          const label =
            lastResultLabel ?? labelFromHistory(run, i) ?? prizeFromHist?.label ?? "Result";
          return {
            status: "won" as const,
            prize: { id: "last", label },
          };
        }
        if (gambleFlipActive) {
          return { status: "ready" as const, prize: prizeFromHist };
        }
        if (awaitingClaim) {
          const label =
            lastResultLabel ?? labelFromHistory(run, i) ?? prizeFromHist?.label ?? "Result";
          return {
            status: "won" as const,
            prize: { id: "last", label },
          };
        }
        if (run.phase === "active") {
          return { status: "ready" as const, prize: null };
        }
        return { status: "claimed" as const, prize: prizeFromHist };
      }
      return { status: "locked" as const, prize: null };
    });
}

export function useRunReelRounds(
  run: RunState | null,
  awaitingClaim: boolean,
  lastResultLabel: string | null,
  gambleFlipActive: boolean,
  pendingBossCycleTransition = false
): ScrollWheelRound[] {
  return useMemo(() => {
    if (run == null) return [];
    return buildRunReelRounds(
      run,
      awaitingClaim,
      lastResultLabel,
      gambleFlipActive,
      pendingBossCycleTransition
    );
  }, [
    awaitingClaim,
    gambleFlipActive,
    pendingBossCycleTransition,
    lastResultLabel,
    run?.wheelIndex,
    run?.floor,
    run?.phase,
    run?.history.length,
    run?.wheels.length,
    run == null
      ? ""
      : run.wheels.map((w) => w.slices.length).join("."),
    run == null || run.history.length === 0
      ? ""
      : `${run.history[run.history.length - 1]!.wheelIndex}:${run.history[run.history.length - 1]!.sliceId}`,
  ]);
}
