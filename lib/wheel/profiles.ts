import type { WheelExperienceProfile, WheelPhysicsConfig } from "./types";
import { resolveWheelPhysics } from "./resolveWheelPhysics";

/** Default Cash Spin reel — tune `physics` or swap `id` for A/B tests. */
export const CASH_SPIN_WHEEL_PROFILE: WheelExperienceProfile = {
  id: "cash-spin-default-v1",
  version: 1,
  wheelTypeId: "cash-spin",
  physics: resolveWheelPhysics({
    baseDurationMs: 9800,
    durationJitter: { min: 0.97, max: 1.05 },
    extraFullTurns: { min: 5, max: 11 },
    landingJitterSegmentFraction: 0.26,
    decel: { kind: "fixed", preset: "friction" },
    settleWobble: {
      enabled: true,
      tailKind: "spring",
      tailSpring: { friction: 8.35, tension: 18.2 },
      amplitudeSliceFraction: 0.065,
      maxExcursionDeg: 2.35,
      wobbleLegs: 3,
      durationFraction: 0.15,
      decay: 0.55,
    },
    safetySlackMs: 2100,
  }),
  gamification: {
    enabledRules: [],
    meta: {},
  },
};

export function mergeWheelExperienceProfile(
  base: WheelExperienceProfile,
  patch: {
    physics?: Partial<WheelPhysicsConfig>;
    gamification?: WheelExperienceProfile["gamification"];
    presentation?: WheelExperienceProfile["presentation"];
  }
): WheelExperienceProfile {
  return {
    ...base,
    physics: resolveWheelPhysics({ ...base.physics, ...patch.physics }),
    gamification: patch.gamification ?? base.gamification,
    presentation: patch.presentation ?? base.presentation,
  };
}
