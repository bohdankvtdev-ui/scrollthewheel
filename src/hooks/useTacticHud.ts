import { useEffect, useState } from "react";
import type { RunState } from "../schemas";
import { shouldShowTacticPicker } from "../game/tactics/wheelHubState";

export const TACTIC_PICK_DELAY_MS = 300;

export type TacticHudPhase = "hidden" | "pick";

type UseTacticHudOpts = {
  run: RunState | null;
  awaitingClaim: boolean;
  isSpinning: boolean;
  lastSliceId: string | null;
  gambleFlipActive: boolean;
  hasPreSpinSnapshot: boolean;
};

export type TacticHudState = {
  phase: TacticHudPhase;
  showScrim: boolean;
};

export function useTacticHud(opts: UseTacticHudOpts): TacticHudState {
  const { run, awaitingClaim, isSpinning, lastSliceId, gambleFlipActive, hasPreSpinSnapshot } =
    opts;
  const [pickReady, setPickReady] = useState(false);

  const wantPicker =
    run != null &&
    shouldShowTacticPicker(
      run,
      awaitingClaim,
      isSpinning,
      gambleFlipActive,
      hasPreSpinSnapshot
    );

  useEffect(() => {
    if (!wantPicker) {
      setPickReady(false);
      return;
    }
    setPickReady(false);
    const t = setTimeout(() => setPickReady(true), TACTIC_PICK_DELAY_MS);
    return () => clearTimeout(t);
  }, [wantPicker, lastSliceId]);

  if (!wantPicker || !pickReady) {
    return { phase: "hidden", showScrim: false };
  }

  return { phase: "pick", showScrim: false };
}
