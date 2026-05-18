import type { RunState } from "../../schemas";
import type { MicroChoiceId } from "./microChoices";

export function tacticUsedOnWheel(run: RunState, wheelIndex: number): boolean {
  return (run.runEffects?.microChoiceWheelIndex ?? -1) === wheelIndex;
}

export function getTacticUsedOnWheel(
  run: RunState,
  wheelIndex: number
): MicroChoiceId | null {
  if (!tacticUsedOnWheel(run, wheelIndex)) return null;
  const id = run.runEffects?.tacticUsedId;
  if (id != null) return id as MicroChoiceId;
  return null;
}

/** Player skipped the tactic prompt — no perk spent, picker won't return. */
export function declineTacticOffersOnWheel(run: RunState, wheelIndex: number): RunState {
  return {
    ...run,
    runEffects: {
      ...run.runEffects,
      microChoiceWheelIndex: wheelIndex,
      tacticUsedId: undefined,
      microChoiceOffers: undefined,
      microChoiceOffersWheel: undefined,
    },
  };
}
