import { useCallback, useRef } from "react";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { computeTargetAngleDeg } from "../animation/wheelSpinWorklet";
import { CASH_SPIN_WHEEL_PROFILE } from "../../lib/wheel/profiles";
import { resolveWheelPhysics } from "../../lib/wheel/resolveWheelPhysics";
import type { WheelPhysicsConfig } from "../../lib/wheel/types";

const BOSS_PHYSICS: Partial<WheelPhysicsConfig> = {
  baseDurationMs: 7200,
  extraFullTurns: { min: 6, max: 12 },
};

function physicsForProfile(profileId: string): WheelPhysicsConfig {
  const base = CASH_SPIN_WHEEL_PROFILE.physics;
  if (profileId === "boss") {
    return resolveWheelPhysics({ ...base, ...BOSS_PHYSICS });
  }
  return base;
}

function pickExtraTurns(physics: WheelPhysicsConfig): number {
  const { min, max } = physics.extraFullTurns;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function useWheelSpin(sliceCount: number, physicsProfileId = "default") {
  const rotation = useSharedValue(0);
  const isSpinning = useSharedValue(false);
  const physics = physicsForProfile(physicsProfileId);
  const onEndRef = useRef<((index: number) => void) | undefined>(undefined);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const finishSpin = useCallback((index: number) => {
    isSpinning.value = false;
    onEndRef.current?.(index);
  }, [isSpinning]);

  const spinToIndex = useCallback(
    (targetIndex: number, onEnd?: (index: number) => void) => {
      if (isSpinning.value || sliceCount <= 0) return;
      onEndRef.current = onEnd;
      isSpinning.value = true;

      const extraTurns = pickExtraTurns(physics);
      const endDeg = computeTargetAngleDeg(targetIndex, sliceCount, extraTurns);
      const j = physics.durationJitter;
      const duration = Math.round(
        physics.baseDurationMs * (j.min + Math.random() * (j.max - j.min))
      );

      rotation.value = 0;
      rotation.value = withTiming(
        endDeg,
        { duration, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(finishSpin)(targetIndex);
          }
        }
      );
    },
    [finishSpin, isSpinning, physics, rotation, sliceCount]
  );

  return {
    rotation,
    animatedStyle,
    spinToIndex,
    isSpinning,
  };
}
