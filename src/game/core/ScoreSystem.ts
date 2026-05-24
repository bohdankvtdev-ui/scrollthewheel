import { computeRunChipAward, applyChipGain } from "../runState/chipsScoring";
import type { RunState } from "../../schemas";

/** Meta score (chips) and in-run chip awards — pure, no React. */
export const ScoreSystem = {
  computeRunChipAward,
  applyChipGain,

  peakMoney(run: RunState): number {
    return Math.max(run.peakMoney ?? 0, run.money);
  },

  cycleDepth(run: RunState): number {
    return Math.max(1, run.floor);
  },
};
