import { useShallow } from "zustand/react/shallow";
import { useRunStore } from "../stores/runStore";

/** Batched UI selectors — one subscription instead of many in `RunWheelFeed`. */
export function useRunWheelUi() {
  return useRunStore(
    useShallow((s) => ({
      awaitingClaim: s.ui.awaitingClaim,
      isSpinning: s.ui.isSpinning,
      gambleFlipActive: s.ui.gambleFlipActive,
      sliceEraseMode: s.ui.sliceEraseMode,
      lastResultLabel: s.ui.lastResultLabel,
      bossCyclePhase: s.ui.bossCyclePhase,
      spinFeedbackTier: s.ui.spinFeedbackTier,
      washFlashEpoch: s.ui.washFlashEpoch,
      washFlashTier: s.ui.washFlashTier,
    }))
  );
}
