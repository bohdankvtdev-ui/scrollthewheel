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

/** Where the pointer sits along the winning slice: ~0 = inner edge, ~1 = outer edge (in index space). */
function randomSlicePointerT(): number {
  const edge = 0.14;
  const span = 1 - 2 * edge;
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c != null && typeof c.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return edge + (Number(buf[0]) / 4294967296) * span;
  }
  return edge + Math.random() * span;
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

/** How far short of the prize the friction coast ends — spring closes the gap (degrees). */
function springUndershootDeg(angleBySegment: number): number {
  const sliceBased = angleBySegment * 0.038;
  return Math.min(1.42, Math.max(0.62, sliceBased)) * (0.9 + Math.random() * 0.18);
}

export function useSpinWheel(
  dataLength: number,
  physics: WheelPhysicsConfig,
  onSpinInterrupted?: () => void
) {
  const angle = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);
  const spinInFlightRef = useRef(false);
  const onInterruptedRef = useRef(onSpinInterrupted);
  onInterruptedRef.current = onSpinInterrupted;
  const [enabled, setEnabled] = useState(true);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  /** Wheel angle (deg) at last completed rest — for upright prize labels. */
  const [lastRestAngleDeg, setLastRestAngleDeg] = useState<number | null>(null);
  const angleBySegment = ONE_TURN / Math.max(1, dataLength);
  const angleOffset = angleBySegment / 2;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (spinInFlightRef.current) {
        onInterruptedRef.current?.();
      }
      spinInFlightRef.current = false;
      mountedRef.current = false;
      angle.stopAnimation();
    };
  }, [angle]);

  useEffect(() => {
    // Do not abort a spin when wedge rebuild changes slice count (e.g. builder wheel).
    if (spinInFlightRef.current) return;
    angle.stopAnimation();
    angle.setValue(0);
    setWinnerIndex(null);
    setLastRestAngleDeg(null);
    setEnabled(true);
  }, [dataLength, angle]);

  const spinToIndex = (
    targetIndex: number,
    onEnd?: (index: number) => void,
    /** Parent `ref.spinToIndex` — recover from a cancelled spin leaving `enabled` false. */
    force = false
  ) => {
    if (!enabled && !force) return;
    const randomIndex = Math.max(0, Math.min(dataLength - 1, targetIndex));
    const slicePointerT = randomSlicePointerT();
    const targetAngle =
      (ONE_TURN - ((randomIndex + slicePointerT) * angleBySegment) + angleOffset) % ONE_TURN;

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
    const wobbleOn = wobbleCfg?.enabled === true;
    const tailKind = wobbleCfg?.tailKind ?? "spring";

    setEnabled(false);
    spinInFlightRef.current = true;
    setWinnerIndex(null);
    angle.stopAnimation();
    angle.setValue(0);

    const finish = () => {
      if (!mountedRef.current) return;
      spinInFlightRef.current = false;
      setLastRestAngleDeg(finalAngle);
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

    /** Damped spring into exact rest — continuous velocity feel vs chained timings. */
    if (tailKind === "spring") {
      const creep = springUndershootDeg(angleBySegment);
      const mainEnd = finalAngle - creep;
      const mainMs = Math.max(620, Math.round(duration * 0.862));
      const ts = wobbleCfg.tailSpring;
      const friction = ts?.friction ?? 9;
      const tension = ts?.tension ?? 17.5;

      Animated.sequence([
        Animated.timing(angle, {
          toValue: mainEnd,
          duration: mainMs,
          easing: mainEasing,
          useNativeDriver: true,
        }),
        Animated.spring(angle, {
          toValue: finalAngle,
          useNativeDriver: true,
          friction,
          tension,
          overshootClamping: true,
          restDisplacementThreshold: 0.02,
          restSpeedThreshold: 0.02,
        }),
      ]).start(({ finished }) => {
        if (!finished || !mountedRef.current) return;
        finish();
      });
      return;
    }

    /* Legacy multi-leg settle (tailKind === "sequence") */
    if ((wobbleCfg.wobbleLegs ?? 0) < 2) {
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

  const spin = (onEnd?: (index: number) => void) => {
    spinToIndex(randomPrizeIndex(dataLength), onEnd);
  };

  return {
    angle,
    spin,
    spinToIndex,
    enabled,
    winnerIndex,
    lastRestAngleDeg,
    angleBySegment,
    angleOffset,
  };
}
