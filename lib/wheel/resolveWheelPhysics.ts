import type { WheelPhysicsConfig } from "./types";

const DEFAULT_SETTLE_WOBBLE = {
  enabled: true,
  amplitudeSliceFraction: 0.055,
  maxExcursionDeg: 2.1,
  wobbleLegs: 3,
  durationFraction: 0.16,
  decay: 0.58,
} as const;

const DEFAULT_PHYSICS: WheelPhysicsConfig = {
  baseDurationMs: 8000,
  durationJitter: { min: 0.96, max: 1.06 },
  extraFullTurns: { min: 5, max: 10 },
  landingJitterSegmentFraction: 0.38,
  decel: { kind: "random_pool" },
  settleWobble: { ...DEFAULT_SETTLE_WOBBLE },
  safetySlackMs: 1000,
};

/**
 * Latest moment a spin should finish (base × max jitter + slack); use for stuck-spin guards.
 */
export function spinSafetyTimeoutMs(physics: WheelPhysicsConfig, extraPadMs = 800): number {
  return Math.ceil(physics.baseDurationMs * physics.durationJitter.max) + physics.safetySlackMs + extraPadMs;
}

/**
 * Merge partial physics over defaults. Use from screens, remote config, or A/B layers.
 */
export function resolveWheelPhysics(overrides?: Partial<WheelPhysicsConfig>): WheelPhysicsConfig {
  if (overrides == null) return { ...DEFAULT_PHYSICS };
  const sw = overrides.settleWobble;
  return {
    ...DEFAULT_PHYSICS,
    ...overrides,
    durationJitter: { ...DEFAULT_PHYSICS.durationJitter, ...overrides.durationJitter },
    extraFullTurns: { ...DEFAULT_PHYSICS.extraFullTurns, ...overrides.extraFullTurns },
    decel: overrides.decel ?? DEFAULT_PHYSICS.decel,
    settleWobble: sw
      ? { ...DEFAULT_SETTLE_WOBBLE, ...DEFAULT_PHYSICS.settleWobble, ...sw }
      : { ...DEFAULT_SETTLE_WOBBLE },
  };
}

export { DEFAULT_PHYSICS };
