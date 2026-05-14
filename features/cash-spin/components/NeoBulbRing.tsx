import { memo, useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  clamp,
  Easing,
  interpolateColor,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  useFrameCallback,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, RadialGradient, Stop } from "react-native-svg";
import type { BulbRingLayout } from "../../../lib/layout/wheelFrame";
import { Neo, NeoBulbRingTheme } from "../../../theme/neoBrutal";
import type { BulbRingPhase } from "../bulbRingPhase";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HALO_OUTER_FILL = NeoBulbRingTheme.bulbLightningHalo;
const HALO_INNER_FILL = NeoBulbRingTheme.bulbLightningHaloCore;

function fract(x: number): number {
  "worklet";
  return x - Math.floor(x);
}

function hash01(i: number, salt: number): number {
  "worklet";
  return fract(Math.sin(i * 127.1 + salt * 413.2) * 9988.551);
}

function circDist(a: number, b: number, n: number): number {
  "worklet";
  let d = Math.abs(a - b);
  if (d > n * 0.5) d = n - d;
  return d;
}

/**
 * Extra forks / micro-strikes on top of slow sine envelope (reads more “electric”).
 */
function bulbArcIntensity(index: number, tSec: number): number {
  "worklet";
  const t = tSec * 0.34;
  const i = index;
  const h0 = hash01(i, 0);
  const h1 = hash01(i, 1);
  const w1 = (0.42 + h0 * 0.38) * 0.55;
  const w2 = (0.95 + h1 * 0.75) * 0.5;
  const w3 = (2.4 + (i % 6) * 0.35) * 0.45;
  const slow = 0.5 + 0.5 * Math.sin(t * w1 + i * 0.71);
  const mid = 0.5 + 0.5 * Math.sin(t * w2 + i * 2.31);
  const ripple = Math.pow(0.5 + 0.5 * Math.sin(t * w3 + i * 1.07), 8) * 0.36;

  const period = (3.2 + h0 * 5.5) * 1.15;
  const u = fract(t / period + h1 * 6.28318);
  const span = 0.045 + h1 * 0.055;
  let strike = 0;
  if (u < span) {
    const k = u / span;
    strike = Math.sin(Math.PI * k) * (0.52 + 0.42 * hash01(i, 2));
  }

  const period2 = period * (0.42 + h0 * 0.2);
  const u2 = fract(t / period2 + h0 * 3.17);
  const span2 = 0.014 + h1 * 0.018;
  let fork = 0;
  if (u2 < span2) {
    const k2 = u2 / span2;
    fork = Math.sin(Math.PI * k2) * (0.24 + 0.18 * hash01(i, 4));
  }

  const calm = 0.14 + slow * 0.22 + mid * 0.13;
  return clamp(calm + ripple + strike + fork, 0, 1);
}

function bulbPhysics(
  index: number,
  bulbCount: number,
  tSec: number,
  chaseVal: number,
  burstVal: number
): {
  b: number;
  glowMix: number;
  scale: number;
  haloBoost: number;
  chaseGlow: number;
} {
  "worklet";
  const head = chaseVal % bulbCount;
  const d0 = circDist(head, index, bulbCount);
  const d1 = circDist(head - 1.85, index, bulbCount);
  const d2 = circDist(head - 3.55, index, bulbCount);
  const sigma = 0.72;
  const g0 = Math.exp(-(d0 * d0) / (2 * sigma * sigma));
  const g1 = Math.exp(-(d1 * d1) / (2 * 1.38 * 1.38));
  const g2 = Math.exp(-(d2 * d2) / (2 * 2.05 * 2.05));
  const chaseGlow = clamp((g0 + 0.46 * g1 + 0.3 * g2) / 1.32, 0, 1);

  const arc = bulbArcIntensity(index, tSec);
  const shimmer = 0.042 * Math.sin(tSec * 6.5 + index * 1.4);
  const idleGlow = clamp(
    chaseGlow * 0.82 + arc * 0.58 + shimmer * (0.35 + chaseGlow * 0.95),
    0,
    1.28
  );

  const winPulse = 1 + 0.035 * Math.sin(tSec * 9 + index * 1.1);
  const combined = clamp((1 - burstVal) * idleGlow + burstVal * winPulse, 0, 1.22);
  const glowMix = clamp(combined, 0, 1);

  const haloBoost = clamp(chaseGlow * 0.58 + Math.max(0, arc - 0.06) * 1.02, 0, 1.25);

  const scale = clamp(0.9 + 0.18 * glowMix + 0.11 * burstVal, 0.88, 1.14);

  return { b: burstVal, glowMix, scale, haloBoost, chaseGlow };
}

function bulbAngle(index: number, bulbCount: number): number {
  return ((index + 0.5) / bulbCount) * Math.PI * 2 - Math.PI / 2;
}

type BulbBaseProps = {
  index: number;
  bulbCount: number;
  cx: number;
  cy: number;
  baseR: number;
  clockMs: SharedValue<number>;
  chase: SharedValue<number>;
  burst: SharedValue<number>;
};

const NeoBulbCast = memo(function NeoBulbCast(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { glowMix, scale, b } = bulbPhysics(index, bulbCount, t, chase.value, burst.value);
    const r = baseR * scale * 1.1;
    const op = clamp(0.16 + 0.68 * glowMix * (1 - b * 0.26) + 0.1 * b, 0.1, 0.94);
    return {
      cx: cx + 1.85,
      cy: cy + 2.45,
      r,
      opacity: op,
      fill: NeoBulbRingTheme.bulbShadowCast,
    };
  }, [baseR, bulbCount, cx, cy, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

/** Wide amber corona — reads as lightning bloom + chase head glow. */
const NeoBulbHaloOuter = memo(function NeoBulbHaloOuter(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, scale, haloBoost, chaseGlow } = bulbPhysics(index, bulbCount, t, chase.value, burst.value);
    const r = baseR * scale * 1.86;
    const pulse = 0.32 * chaseGlow + 0.68 * haloBoost;
    const op = clamp(pulse * (1 - b * 0.14) + b * 0.58, 0, 0.98);
    return { cx, cy, r, opacity: op, fill: HALO_OUTER_FILL };
  }, [baseR, bulbCount, cx, cy, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

/** Tight cool core bloom behind the glass cap. */
const NeoBulbHaloInner = memo(function NeoBulbHaloInner(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, scale, haloBoost, chaseGlow } = bulbPhysics(index, bulbCount, t, chase.value, burst.value);
    const r = baseR * scale * 1.34;
    const op = clamp((0.24 + 0.58 * haloBoost + 0.38 * chaseGlow) * (1 - b * 0.1) + b * 0.42, 0, 0.94);
    return { cx, cy, r, opacity: op, fill: HALO_INNER_FILL };
  }, [baseR, bulbCount, cx, cy, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

const NeoBulbBody = memo(function NeoBulbBody(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, glowMix, scale } = bulbPhysics(index, bulbCount, t, chase.value, burst.value);

    const bgIdle = interpolateColor(
      glowMix,
      [0, 0.28, 0.72, 1],
      [NeoBulbRingTheme.bulbDim, NeoBulbRingTheme.bulbMid, NeoBulbRingTheme.bulbHot, NeoBulbRingTheme.bulbShine]
    );
    const winPeak = interpolateColor(
      clamp((b - 0.82) / 0.18, 0, 1),
      [0, 1],
      [NeoBulbRingTheme.victoryFill, NeoBulbRingTheme.victoryFillCore]
    );
    const bgWin = interpolateColor(b, [0, 1], [bgIdle, winPeak]);

    const borderIdle = interpolateColor(
      glowMix,
      [0, 1],
      [NeoBulbRingTheme.bulbRimDim, NeoBulbRingTheme.bulbRimHot]
    );
    const borderWin = interpolateColor(b, [0, 1], [borderIdle, NeoBulbRingTheme.bulbRimHot]);

    const opacity = clamp(0.34 + 0.78 * glowMix * (1 - b * 0.06) + 0.2 * b, 0.22, 1);
    const r = baseR * scale;
    const strokeW = clamp(1.08 + 1.05 * b + glowMix * 0.55, 1, 2.85);

    return {
      cx,
      cy,
      r,
      opacity,
      fill: bgWin,
      stroke: borderWin,
      strokeWidth: strokeW,
    };
  }, [baseR, bulbCount, cx, cy, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

export type NeoBulbRingProps = {
  layout: BulbRingLayout;
  phase: BulbRingPhase;
};

/**
 * Rose ring on purple app bg; idle = clockwise hypnotic chase + per-bulb lightning;
 * layered cast + halos for depth; victory = yellow flash on rim + bulbs.
 */
export function NeoBulbRing({ layout, phase }: NeoBulbRingProps) {
  const gradId = useId().replace(/:/g, "");
  const bulbCount = layout.bulbs.length;
  const clockMs = useSharedValue(0);
  const chase = useSharedValue(0);
  const burst = useSharedValue(0);

  const { setActive } = useFrameCallback(({ timeSinceFirstFrame }) => {
    "worklet";
    clockMs.value = timeSinceFirstFrame;
  }, false);

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  const d = layout.outerDiameter;
  const hubX = d / 2;
  const hubY = d / 2;
  const orbit = layout.bulbOrbit;
  const bulbR = layout.bulbDiameter / 2;

  useEffect(() => {
    chase.value = 0;
    const laps = 220;
    const lapMs = 3600;
    chase.value = withRepeat(
      withTiming(bulbCount * laps, {
        duration: lapMs * laps,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(chase);
    };
  }, [bulbCount, d]);

  useEffect(() => {
    if (phase === "victory") {
      burst.value = withSequence(
        withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
        withDelay(
          NeoBulbRingTheme.victoryHoldMs,
          withTiming(0, {
            duration: NeoBulbRingTheme.victoryFadeMs,
            easing: Easing.inOut(Easing.cubic),
          })
        )
      );
    } else {
      cancelAnimation(burst);
      burst.value = withTiming(0, { duration: 380, easing: Easing.inOut(Easing.cubic) });
    }
  }, [phase, burst]);

  const ringStyle = useAnimatedStyle(() => {
    const b = burst.value;
    return {
      borderWidth: clamp(NeoBulbRingTheme.ringBorderWidthIdle + b * 3.2, 1, 6),
      borderColor: interpolateColor(b, [0, 1], [NeoBulbRingTheme.ringBorderIdle, NeoBulbRingTheme.ringBorderVictory]),
    };
  }, []);

  const common = { bulbCount, clockMs, chase, burst } as const;

  return (
    <View
      style={{
        width: d,
        height: d,
        position: "relative",
        borderRadius: d / 2,
        overflow: "hidden",
        backgroundColor: NeoBulbRingTheme.ringFillShadow,
      }}
      pointerEvents="none"
    >
      <Svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} pointerEvents="none">
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" fx="50%" fy="50%" r="55%">
            <Stop offset="0%" stopColor={NeoBulbRingTheme.ringFillHighlight} stopOpacity={1} />
            <Stop offset="52%" stopColor={NeoBulbRingTheme.ringFill} stopOpacity={1} />
            <Stop offset="100%" stopColor={NeoBulbRingTheme.ringFillShadow} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle cx={hubX} cy={hubY} r={d / 2} fill={`url(#${gradId})`} />
        {Array.from({ length: bulbCount }, (_, i) => {
          const a = bulbAngle(i, bulbCount);
          const cx = hubX + Math.cos(a) * orbit;
          const cy = hubY + Math.sin(a) * orbit;
          return (
            <G key={i}>
              <NeoBulbCast {...common} index={i} cx={cx} cy={cy} baseR={bulbR} />
              <NeoBulbHaloOuter {...common} index={i} cx={cx} cy={cy} baseR={bulbR} />
              <NeoBulbHaloInner {...common} index={i} cx={cx} cy={cy} baseR={bulbR} />
              <NeoBulbBody {...common} index={i} cx={cx} cy={cy} baseR={bulbR} />
            </G>
          );
        })}
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: d / 2,
            backgroundColor: "transparent",
          },
          ringStyle,
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: d / 2,
            borderWidth: Neo.borderThin,
            borderColor: NeoBulbRingTheme.ringFillStroke,
            backgroundColor: "transparent",
          },
        ]}
      />
    </View>
  );
}
