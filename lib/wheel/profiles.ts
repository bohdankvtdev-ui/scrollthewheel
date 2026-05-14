import type { WheelExperienceProfile, WheelPhysicsConfig } from "./types";
import { resolveWheelPhysics } from "./resolveWheelPhysics";

/** Default Cash Spin reel — tune `physics` or swap `id` for A/B tests. */
export const CASH_SPIN_WHEEL_PROFILE: WheelExperienceProfile = {
  id: "cash-spin-default-v1",
  version: 1,
  wheelTypeId: "cash-spin",
  physics: resolveWheelPhysics({
    baseDurationMs: 9000,
    durationJitter: { min: 0.97, max: 1.05 },
    extraFullTurns: { min: 5, max: 11 },
    landingJitterSegmentFraction: 0.32,
    decel: { kind: "fixed", preset: "glide" },
    settleWobble: {
      enabled: true,
      amplitudeSliceFraction: 0.06,
      maxExcursionDeg: 2.2,
      wobbleLegs: 3,
      durationFraction: 0.17,
      decay: 0.58,
    },
    safetySlackMs: 1400,
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
