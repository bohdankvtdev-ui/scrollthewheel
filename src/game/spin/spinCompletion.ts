/** UI state after a spin result was already applied for the current wheel. */
export function isDuplicateSpinResultApply(
  ui: {
    isSpinning: boolean;
    awaitingClaim: boolean;
    lastSliceId: string | null;
  },
  currentWheelIndex: number,
  applyWheelIndex: number,
  sliceId: string
): boolean {
  return (
    !ui.isSpinning &&
    ui.awaitingClaim &&
    applyWheelIndex === currentWheelIndex &&
    ui.lastSliceId === sliceId
  );
}

export type ActiveSpinSession = {
  wheelIndex: number;
  sliceId: string;
  sliceIndex: number;
  slice: import("../../schemas").SliceDefinition;
  isGambleFlip?: boolean;
  consumed: boolean;
};

/** Armed at spin press, committed when the wheel animation settles (survives remounts). */
export type ArmedSpinSession = {
  wheelIndex: number;
  sliceId: string;
  sliceIndex: number;
  slice: import("../../schemas").SliceDefinition;
  isGambleFlip?: boolean;
};

export function canConsumeSpinSession(session: ActiveSpinSession | null): session is ActiveSpinSession {
  return session != null && !session.consumed;
}

export function consumeSpinSession(session: ActiveSpinSession): void {
  session.consumed = true;
}
