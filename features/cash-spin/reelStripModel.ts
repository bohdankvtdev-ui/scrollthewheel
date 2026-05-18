import type { SpinWheelItem } from "../../types/spin";

export type RoundStatus = "locked" | "ready" | "won" | "claimed";

export type ScrollWheelRound = {
  status: RoundStatus;
  prize: SpinWheelItem | null;
};

/**
 * Furthest index the player may park the strip on (forward-only reel).
 * Stops on the first ready round, or the step after a won round.
 */
export function computeMaxActiveIndex(rounds: ScrollWheelRound[]): number {
  const n = rounds.length;
  if (n === 0) return 0;
  for (let i = 0; i < n; i++) {
    if (rounds[i].status === "ready") return i;
    if (rounds[i].status === "won") return Math.min(i + 1, n - 1);
  }
  return n - 1;
}
