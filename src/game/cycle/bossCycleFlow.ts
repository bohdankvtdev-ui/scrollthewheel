import { InteractionManager } from "react-native";
import type { RunState } from "../../schemas";

/** Boss wheel cleared → cycle reward card → next cycle wheel 1. */
export type BossCyclePhase = "none" | "reward";

let pendingApply: { cancel: () => void } | null = null;

/** Run heavy cycle transition after the reward overlay has painted (avoids wheel flash). */
export function scheduleBossCycleRewardApply(apply: () => void): void {
  pendingApply?.cancel();
  pendingApply = InteractionManager.runAfterInteractions(() => {
    pendingApply = null;
    apply();
  });
}

export function cancelBossCycleRewardApply(): void {
  pendingApply?.cancel();
  pendingApply = null;
}

export function isBossCycleOverlay(phase: BossCyclePhase): boolean {
  return phase === "reward";
}

/** Keep wheel feed mounted but invisible while the reward card is up. */
export function shouldHideWheelFeedDuringBoss(phase: BossCyclePhase): boolean {
  return phase === "reward";
}

export function canDismissBossOverlay(
  run: RunState | null,
  phase: BossCyclePhase
): boolean {
  return run != null && phase === "reward" && run.phase === "won";
}
