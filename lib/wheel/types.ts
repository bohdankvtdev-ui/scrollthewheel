/**
 * Wheel experience model — extend as you add wheel types, perks, and live-ops tuning.
 * Keep serializable fields here so profiles can be loaded from JSON / remote config later.
 */

/** Identifier for a wheel “SKU” (layout rules, slice count, perk hooks). */
export type WheelTypeId = "cash-spin" | "standard" | string;

/** How the spin eases in the second half (single-phase `Animated.timing`). */
export type WheelDecelMode =
  | { kind: "random_pool" }
  | { kind: "fixed"; preset: WheelDecelPresetId };

export type WheelDecelPresetId =
  | "smooth"
  | "dramatic"
  | "long_coast"
  | "tight_brake"
  | "cinematic"
  /** Long, soft tail — good default for “premium” / polished spins. */
  | "glide";

/** Tiny inertial settle after main decel — keep excursions small so it reads as mass + friction, not a swaying UI. */
export type WheelSettleWobbleConfig = {
  enabled: boolean;
  /**
   * Overshoot scale vs one slice angle, then clamped by `maxExcursionDeg` so few-slice wheels
   * do not swing through a huge arc.
   */
  amplitudeSliceFraction: number;
  /** Hard cap on first overshoot (degrees); primary realism control. */
  maxExcursionDeg: number;
  /** Eased legs after main decel (each leg reverses direction, last lands on the prize angle). */
  wobbleLegs: number;
  /** Share of the spin’s wall-clock time used for wobble (main decel gets the rest). */
  durationFraction: number;
  /** Per-leg decay on swing size (higher = smaller return swing). */
  decay: number;
};

/**
 * Tunable spin kinematics — all durations in ms, angles in degrees logic lives in `useSpinWheel`.
 */
export type WheelPhysicsConfig = {
  /** Total spin duration before random jitter is applied. */
  baseDurationMs: number;
  /** Multiply duration by `min + random * (max - min)` each spin. */
  durationJitter: { min: number; max: number };
  /** Full 360° rotations before landing on the weighted slice. */
  extraFullTurns: { min: number; max: number };
  /** Max landing offset as a fraction of one slice width (keeps same prize wedge). */
  landingJitterSegmentFraction: number;
  decel: WheelDecelMode;
  /** Optional damped oscillation near rest; omit or `enabled: false` for a single easing curve. */
  settleWobble?: WheelSettleWobbleConfig;
  /**
   * Extra time after `effectiveDuration` for safety timers (stuck-spin guard).
   * Should exceed worst-case jitter; keep ~400–1200 for single-phase spins.
   */
  safetySlackMs: number;
};

/** Placeholder for streaks, multipliers, pity, VIP curves — wire fields when you add systems. */
export type WheelGamificationConfig = {
  /** Future: e.g. `['near_miss_v1', 'double_gold_hour']` */
  enabledRules?: readonly string[];
  /** Opaque payload for server-driven experiments. */
  meta?: Record<string, unknown>;
};

export type WheelPresentationConfig = {
  /** Future: token into a theme registry instead of raw hex arrays. */
  segmentColorPaletteId?: string;
};

/**
 * One deployable wheel definition — merge partials over a default profile per screen or A/B test.
 */
export type WheelExperienceProfile = {
  id: string;
  version: number;
  wheelTypeId: WheelTypeId;
  physics: WheelPhysicsConfig;
  presentation?: WheelPresentationConfig;
  gamification?: WheelGamificationConfig;
};
