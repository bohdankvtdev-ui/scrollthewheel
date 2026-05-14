import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { resolveDecelEasing } from "../../lib/wheel/decelCurves";
import type { WheelPhysicsConfig } from "../../lib/wheel/types";

const ONE_TURN = 360;

function pickRandomInt(min: number, maxInclusive: number): number {
  return min + Math.floor(Math.random() * (maxInclusive - min + 1));
}

/** Uniform index in [0, dataLength) — prefers `crypto.getRandomValues` when available. */
function randomPrizeIndex(dataLength: number): number {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c != null && typeof c.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return Number(buf[0]) % dataLength;
  }
  return Math.floor(Math.random() * dataLength);
}

/** Keypoints after main decel: first is overshoot past `F`, last is exact rest angle. */
function buildWobbleKeypoints(F: number, amp: number, decay: number, legs: number): number[] {
  const n = Math.max(2, Math.round(legs));
  const out: number[] = [F + amp];
  for (let i = 1; i < n; i++) {
    const mag = amp * decay ** i;
    const sign = i % 2 === 1 ? -1 : 1;
    out.push(F + sign * mag);
  }
  out.push(F);
  return out;
}

/**
 * Distribute settle time with `√arc` weights so small corrective moves get relatively more
 * duration — reads less “snappy”, more like mass settling.
 */
function allocateSegmentDurations(keypoints: readonly number[], totalMs: number, minMs = 96): number[] {
  const seg: number[] = [];
  for (let i = 0; i < keypoints.length - 1; i++) {
    seg.push(Math.abs(keypoints[i + 1]! - keypoints[i]!));
  }
  const weight = seg.map((len) => Math.sqrt(len + 0.1));
  const sumW = weight.reduce((a, b) => a + b, 0) || 1;
  const raw = weight.map((w) => (totalMs * w) / sumW);
  const rounded = raw.map((ms) => Math.max(minMs, Math.round(ms)));
  const drift = totalMs - rounded.reduce((a, b) => a + b, 0);
  if (drift !== 0 && rounded.length > 0) {
    rounded[rounded.length - 1] = Math.max(minMs, rounded[rounded.length - 1]! + drift);
  }
  return rounded;
}

/** Reversals: smooth in–out; final parking on prize: soft ease-out. */
function easingForWobbleLeg(legIndex: number, legCount: number): (t: number) => number {
  if (legIndex === legCount - 1) {
    return Easing.bezier(0.2, 0.85, 0.22, 1);
  }
  return Easing.inOut(Easing.cubic);
}

export function useSpinWheel(dataLength: number, physics: WheelPhysicsConfig) {
  const angle = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);
  const [enabled, setEnabled] = useState(true);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const angleBySegment = ONE_TURN / dataLength;
  const angleOffset = angleBySegment / 2;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      angle.stopAnimation();
    };
  }, [angle]);

  const spin = (onEnd?: (index: number) => void) => {
    if (!enabled) return;

    const randomIndex = randomPrizeIndex(dataLength);
    const targetAngle =
      (ONE_TURN - ((randomIndex + 0.5) * angleBySegment) + angleOffset) % ONE_TURN;

    const extraTurns = pickRandomInt(physics.extraFullTurns.min, physics.extraFullTurns.max);
    const landingJitter =
      (Math.random() - 0.5) * angleBySegment * physics.landingJitterSegmentFraction;
    const finalAngle = ONE_TURN * extraTurns + targetAngle + landingJitter;

    const j = physics.durationJitter;
    const duration = Math.round(
      physics.baseDurationMs * (j.min + Math.random() * (j.max - j.min))
    );
    const mainEasing = resolveDecelEasing(physics.decel);
    const wobbleCfg = physics.settleWobble;
    const wobbleOn = wobbleCfg?.enabled === true && (wobbleCfg.wobbleLegs ?? 0) >= 2;

    setEnabled(false);
    setWinnerIndex(null);
    angle.stopAnimation();
    angle.setValue(0);

    const finish = () => {
      if (!mountedRef.current) return;
      setWinnerIndex(randomIndex);
      setEnabled(true);
      onEnd?.(randomIndex);
    };

    if (!wobbleOn || wobbleCfg == null) {
      Animated.timing(angle, {
        toValue: finalAngle,
        duration,
        easing: mainEasing,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !mountedRef.current) return;
        finish();
      });
      return;
    }

    const frac = Math.min(0.24, Math.max(0.09, wobbleCfg.durationFraction));
    const mainMs = Math.max(420, Math.round(duration * (1 - frac)));
    const settleMs = Math.max(320, duration - mainMs);

    const sliceAmp = angleBySegment * wobbleCfg.amplitudeSliceFraction;
    const capDeg = wobbleCfg.maxExcursionDeg;
    const ampMag =
      Math.min(sliceAmp, capDeg) * (0.94 + Math.random() * 0.06);
    const decay = Math.min(0.72, Math.max(0.42, wobbleCfg.decay));
    const keys = buildWobbleKeypoints(finalAngle, ampMag, decay, wobbleCfg.wobbleLegs);
    const mainEnd = keys[0]!;
    const wobbleKeys = keys;
    const settleDurs = allocateSegmentDurations(wobbleKeys, settleMs);

    const chain: Animated.CompositeAnimation[] = [
      Animated.timing(angle, {
        toValue: mainEnd,
        duration: mainMs,
        easing: mainEasing,
        useNativeDriver: true,
      }),
    ];

    const settleLegCount = wobbleKeys.length - 1;
    for (let i = 0; i < settleLegCount; i++) {
      chain.push(
        Animated.timing(angle, {
          toValue: wobbleKeys[i + 1]!,
          duration: settleDurs[i] ?? 100,
          easing: easingForWobbleLeg(i, settleLegCount),
          useNativeDriver: true,
        })
      );
    }

    Animated.sequence(chain).start(({ finished }) => {
      if (!finished || !mountedRef.current) return;
      finish();
    });
  };

  return {
    angle,
    spin,
    enabled,
    winnerIndex,
    angleBySegment,
    angleOffset,
  };
}
