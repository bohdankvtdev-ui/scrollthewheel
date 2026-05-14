/**
 * Central tuning for the forward-only reel strip (gesture + springs).
 * Adjust here instead of scattering magic numbers through components.
 *
 * **Low-end / jank**
 * - If the translating strip flickers or spikes memory on old Android, set `performance.androidStripHardwareTexture` to `false`.
 * - Drag scrim / strip fade are additionally scaled at runtime via `stripVisualIntensity` (reduce motion + compact window).
 */
export const REEL_STRIP = {
  growDebounceMs: 160,
  /** Minimum tail length ahead of current index when growing the round list. */
  growAheadSlots: 10,
  lastRoundAutoClaimDelayMs: 80,

  performance: {
    /**
     * Android: promote strip to a hardware layer while translating (often smoother).
     * On some very low-memory devices it can hurt — turn off here app-wide.
     */
    androidStripHardwareTexture: true,
  },

  gesture: {
    failOffsetX: 32,
    activeOffsetY: 16,
    rubberExponent: 0.72,
    rubberStrength: 0.34,
    commitDistanceRatio: 0.2,
    commitVelocityLiftMax: 0.28,
    commitVelocityLiftDivisor: 3200,
    commitFlickVelocity: -780,
  },

  springs: {
    /** Snappier “snap to next reel” for game-like feedback (was 460/38/0.76). */
    commit: { stiffness: 520, damping: 40, mass: 0.72 } as const,
    settle: { stiffness: 300, damping: 28, mass: 0.88 } as const,
    cancel: { stiffness: 260, damping: 24, mass: 0.92 } as const,
  },

  visuals: {
    /** Slightly subtler strip fade while dragging (less flicker over the next wheel). */
    stripOpacityDragFactor: 0.05,
    scrimOpacityQuad: 0.22,
    scrimOpacityLinear: 0.1,
    scrimOpacityMax: 0.32,
  },
} as const;
