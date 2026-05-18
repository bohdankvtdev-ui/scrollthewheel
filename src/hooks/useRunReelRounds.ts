import { useMemo } from "react";
import type { ScrollWheelRound } from "../../features/cash-spin/reelStripModel";
import type { RunState } from "../schemas";
import type { SpinWheelItem } from "../../types/spin";
import { labelFromHistory } from "../game/tactics/wheelHubState";

export function useRunReelRounds(
  run: RunState | null,
  awaitingClaim: boolean,
  lastResultLabel: string | null,
  gambleFlipActive: boolean
): ScrollWheelRound[] {
  return useMemo(() => {
    if (run == null) return [];
    const lastHistByWheel = new Map<number, (typeof run.history)[number]>();
    for (const h of run.history) {
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
  }, [
    awaitingClaim,
    gambleFlipActive,
    lastResultLabel,
    run?.wheelIndex,
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
