/**
 * Cash Spin strip — performance & accessibility helpers.
 *
 * **Predictable situations**
 * - **Reduce motion** (OS setting): user expects less parallax / opacity play; we scale drag visuals to 0.
 * - **Small logical window** (cheap phones / dense UI): fewer GPU-friendly pixels; we lighten scrim + strip fade.
 * - **Very old Android + strip jank**: flip `REEL_STRIP.performance.androidStripHardwareTexture` to `false` in `reelStripConstants.ts`.
 *
 * Tuning: adjust `COMPACT_WINDOW_AREA` or `COMPACT_STRIP_INTENSITY` if QA reports a device class.
 */

/** `width * height` (logical px²) below this ⇒ treat as compact / weaker GPU tier for strip extras. */
export const COMPACT_WINDOW_AREA = 420_000;

/** Strip visual multiplier when compact (not reduce-motion): keep a hint of scrim, not full cost. */
export const COMPACT_STRIP_INTENSITY = 0.55;

/**
 * Wheel scroll-frost when the OS “reduce motion” strip multiplier is 0 — still shows a soft blur
 * while dragging (no extra parallax from the rest of the strip).
 */
export const WHEEL_FROST_INTENSITY_REDUCE_MOTION = 0.48;

export function isCompactCashSpinWindow(width: number, height: number): boolean {
  return Math.round(width * height) < COMPACT_WINDOW_AREA;
}

/**
 * @param reduceMotion — from OS accessibility (see `AccessibilityInfo` + Reanimated `useReducedMotion`).
 * @param compactWindow — small logical area heuristic (see `isCompactCashSpinWindow`).
 * @returns 0…1 multiplier applied to strip opacity fade + drag scrim in `useReelStripEngine`.
 */
export function stripVisualIntensityForDevice(reduceMotion: boolean, compactWindow: boolean): number {
  if (reduceMotion) return 0;
  if (compactWindow) return COMPACT_STRIP_INTENSITY;
  return 1;
}
