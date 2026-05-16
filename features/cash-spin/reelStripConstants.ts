/**
 * Central tuning for the forward-only reel strip (gesture + springs).
 * Adjust here instead of scattering magic numbers through components.
 *
 * **Low-end / jank**
 * - If strip translation flickers on Android, try `performance.androidStripHardwareTexture` → `true` as a tradeoff against SVG overlays on the wheel.
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
     * Default off to keep compositing predictable with SVG overlays on the wheel.
     */
    androidStripHardwareTexture: true,
  },

  gesture: {
    failOffsetX: 36,
    /** Tighter vertical lock-in reads closer to short-form “reel” feeds. */
    activeOffsetY: 12,
    rubberExponent: 0.72,
    rubberStrength: 0.34,
    /** Easier flick-commit to the next wheel once you’ve won. */
    commitDistanceRatio: 0.16,
    commitVelocityLiftMax: 0.32,
    commitVelocityLiftDivisor: 3000,
    commitFlickVelocity: -640,
  },

  /** Forward commit uses timing (predictable); cancel/settle still use springs. */
  commitTimingMs: 260,

  springs: {
    settle: { stiffness: 320, damping: 34, mass: 0.9 } as const,
    cancel: { stiffness: 280, damping: 28, mass: 0.92 } as const,
  },

  visuals: {
    /** Slightly subtler strip fade while dragging (less flicker over the next wheel). */
    stripOpacityDragFactor: 0.05,
    scrimOpacityQuad: 0.22,
    scrimOpacityLinear: 0.1,
    scrimOpacityMax: 0.32,
    /**
     * Scroll-linked treatment on the primary prize disc: circular **film grain** (dots), not blur.
     */
    wheelScrollBlur: {
      /** Max opacity of the grain layer at full drag / wheel impulse. */
      overlayOpacityMax: 0.22,
      /**
       * Web: each wheel tick adds impulse; multiplied by decay on an interval until 0.
       */
      webWheelImpulseGain: 0.028,
      webWheelDecayMs: 28,
      webWheelDecayFactor: 0.88,
    },
    /** Dot film grain — tuned for performance (all circles, no turbulence filters). */
    wheelScrollGrain: {
      dotCount: 64,
    },
  },
} as const;
