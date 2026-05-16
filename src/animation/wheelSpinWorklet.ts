/** Ease-out cubic — runs on UI thread via Reanimated. */
export function easeOutCubic(t: number): number {
  "worklet";
  const u = 1 - t;
  return 1 - u * u * u;
}

/** Map progress [0,1] to rotation degrees for spin landing. */
export function spinRotationAtProgress(
  progress: number,
  startDeg: number,
  endDeg: number
): number {
  "worklet";
  return startDeg + (endDeg - startDeg) * easeOutCubic(progress);
}

export function computeTargetAngleDeg(
  sliceIndex: number,
  sliceCount: number,
  extraTurns: number,
  pointerT = 0.5
): number {
  "worklet";
  const ONE_TURN = 360;
  const angleBySegment = ONE_TURN / sliceCount;
  const angleOffset = angleBySegment / 2;
  const targetAngle =
    (ONE_TURN - ((sliceIndex + pointerT) * angleBySegment) + angleOffset) % ONE_TURN;
  return ONE_TURN * extraTurns + targetAngle;
}
