function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Tablet, iPad, or wide web/desktop viewports — larger HUD + wheel layout. */
export function shouldUseLargeRunUi(input: {
  width: number;
  height: number;
  tablet?: boolean;
  isPad?: boolean;
  platformOs: string;
}): boolean {
  const minSide = Math.min(input.width, input.height);
  if (input.tablet === true || input.isPad === true) return true;
  if (minSide >= 768) return true;
  if (input.platformOs === "web" && minSide >= 480) return true;
  return false;
}

/** Scale factor for run/home chrome on large viewports. */
export function largeRunUiScale(width: number, height: number): number {
  const minSide = Math.min(width, height);
  return clamp(minSide / 600, 1.06, 1.38);
}

export { clamp };
