import { useMemo } from "react";
import type { ScrollWheelRound } from "../../features/cash-spin/reelStripModel";
import type { RunState } from "../schemas";
import type { SpinWheelItem } from "../../types/spin";

export function useRunReelRounds(
  run: RunState | null,
  awaitingClaim: boolean,
  lastResultLabel: string | null
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
              label:
                wheel.slices.find((s) => s.id === hist.sliceId)?.label ?? hist.sliceId,
            }
          : null;

      if (i < run.wheelIndex) {
        return { status: "claimed" as const, prize: prizeFromHist };
      }
      if (i === run.wheelIndex) {
        if (awaitingClaim && lastResultLabel != null) {
          return {
            status: "won" as const,
            prize: { id: "last", label: lastResultLabel },
          };
        }
        if (run.phase === "active") {
          return { status: "ready" as const, prize: null };
        }
        return { status: "claimed" as const, prize: prizeFromHist };
      }
      return { status: "locked" as const, prize: null };
    });
  }, [awaitingClaim, lastResultLabel, run]);
}
