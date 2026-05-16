import type { WheelPhysicsConfig, WheelSettleTailSpringConfig, WheelSettleWobbleConfig } from "./types";

const DEFAULT_TAIL_SPRING: WheelSettleTailSpringConfig = {
  friction: 8.9,
  tension: 17.4,
};

const DEFAULT_SETTLE_WOBBLE: WheelSettleWobbleConfig = {
  enabled: true,
  amplitudeSliceFraction: 0.055,
  maxExcursionDeg: 2.1,
  wobbleLegs: 3,
  durationFraction: 0.16,
  decay: 0.58,
  tailKind: "spring",
  tailSpring: { ...DEFAULT_TAIL_SPRING },
};

const DEFAULT_PHYSICS: WheelPhysicsConfig = {
  baseDurationMs: 8000,
  durationJitter: { min: 0.96, max: 1.06 },
  extraFullTurns: { min: 5, max: 10 },
  landingJitterSegmentFraction: 0.38,
  decel: { kind: "random_pool" },
  settleWobble: { ...DEFAULT_SETTLE_WOBBLE },
  safetySlackMs: 1000,
};

function mergeTailSpring(
  ...layers: readonly (Partial<WheelSettleTailSpringConfig> | undefined)[]
): WheelSettleTailSpringConfig {
  return Object.assign({}, DEFAULT_TAIL_SPRING, ...layers.filter(Boolean));
}

function mergeSettleWobble(sw: Partial<WheelSettleWobbleConfig> | undefined): WheelSettleWobbleConfig {
  if (sw == null) {
    return {
      ...DEFAULT_SETTLE_WOBBLE,
      tailSpring: mergeTailSpring(DEFAULT_SETTLE_WOBBLE.tailSpring),
    };
  }
  const base = DEFAULT_PHYSICS.settleWobble ?? DEFAULT_SETTLE_WOBBLE;
  const merged: WheelSettleWobbleConfig = {
    ...DEFAULT_SETTLE_WOBBLE,
    ...base,
    ...sw,
    tailSpring: mergeTailSpring(base.tailSpring, sw.tailSpring),
  };
  return merged;
}

/**
 * Latest moment a spin should finish (base × max jitter + slack); use for stuck-spin guards.
 * Extra pad covers native spring tail variance.
 */
export function spinSafetyTimeoutMs(physics: WheelPhysicsConfig, extraPadMs = 800): number {
  const springPad =
    physics.settleWobble?.enabled === true && (physics.settleWobble.tailKind ?? "spring") === "spring"
      ? 950
      : 0;
  return (
    Math.ceil(physics.baseDurationMs * physics.durationJitter.max) +
    physics.safetySlackMs +
    extraPadMs +
    springPad
  );
}

/**
 * Merge partial physics over defaults. Use from screens, remote config, or A/B layers.
 */
export function resolveWheelPhysics(overrides?: Partial<WheelPhysicsConfig>): WheelPhysicsConfig {
  if (overrides == null) return { ...DEFAULT_PHYSICS };
  return {
    ...DEFAULT_PHYSICS,
    ...overrides,
    durationJitter: { ...DEFAULT_PHYSICS.durationJitter, ...overrides.durationJitter },
    extraFullTurns: { ...DEFAULT_PHYSICS.extraFullTurns, ...overrides.extraFullTurns },
    decel: overrides.decel ?? DEFAULT_PHYSICS.decel,
    settleWobble: mergeSettleWobble(overrides.settleWobble),
  };
}

export { DEFAULT_PHYSICS };
