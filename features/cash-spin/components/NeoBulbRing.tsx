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
import {
  getBulbRingPalette,
  type BulbRingPalette,
} from "../../../src/game/content/sliceVisualTheme";
import { NeoBulbRingTheme, NeoWheel } from "../../../theme/neoBrutal";
import type { BulbRingPhase } from "../bulbRingPhase";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
 * Softer arcs + slow thermal drift; narrower flashes read closer to real filament variance.
 */
function bulbArcIntensity(index: number, tSec: number): number {
  "worklet";
  const t = tSec * 0.34;
  const i = index;
  const h0 = hash01(i, 0);
  const h1 = hash01(i, 1);
  const w1 = (0.42 + h0 * 0.38) * 0.52;
  const w2 = (0.95 + h1 * 0.75) * 0.46;
  const w3 = (2.4 + (i % 6) * 0.35) * 0.42;
  const slow = 0.5 + 0.5 * Math.sin(t * w1 + i * 0.71);
  const mid = 0.5 + 0.5 * Math.sin(t * w2 + i * 2.31);
  const ripple = Math.pow(0.5 + 0.5 * Math.sin(t * w3 + i * 1.07), 10) * 0.28;

  const thermal = 0.045 * Math.sin(tSec * 1.65 + i * 0.58) + 0.024 * Math.sin(tSec * 0.58 + i * 1.12);

  const period = (3.6 + h0 * 5.8) * 1.12;
  const u = fract(t / period + h1 * 6.28318);
  const span = 0.038 + h1 * 0.048;
  let strike = 0;
  if (u < span) {
    const k = u / span;
    strike = Math.sin(Math.PI * k) * (0.42 + 0.34 * hash01(i, 2)) * 0.42;
  }

  const period2 = period * (0.44 + h0 * 0.22);
  const u2 = fract(t / period2 + h0 * 3.17);
  const span2 = 0.016 + h1 * 0.02;
  let fork = 0;
  if (u2 < span2) {
    const k2 = u2 / span2;
    fork = Math.sin(Math.PI * k2) * (0.22 + 0.15 * hash01(i, 4)) * 0.48;
  }

  const calm = 0.13 + slow * 0.21 + mid * 0.12 + thermal;
  return clamp(calm + ripple + strike + fork, 0, 1);
}

function bulbPhysics(
  index: number,
  bulbCount: number,
  tSec: number,
  chaseVal: number,
  chaseBoost: number,
  burstVal: number
): {
  b: number;
  glowMix: number;
  scale: number;
  haloBoost: number;
  chaseGlow: number;
} {
  "worklet";
  const head = chaseVal * chaseBoost % bulbCount;
  const d0 = circDist(head, index, bulbCount);
  const d1 = circDist(head - 1.85 * chaseBoost, index, bulbCount);
  const d2 = circDist(head - 3.55 * chaseBoost, index, bulbCount);
  const sigma = 0.72;
  const g0 = Math.exp(-(d0 * d0) / (2 * sigma * sigma));
  const g1 = Math.exp(-(d1 * d1) / (2 * 1.38 * 1.38));
  const g2 = Math.exp(-(d2 * d2) / (2 * 2.05 * 2.05));
  const chaseGlow = clamp((g0 + 0.46 * g1 + 0.3 * g2) / 1.32, 0, 1);
  const chaseSoft = Math.pow(chaseGlow, 0.88);

  const arc = bulbArcIntensity(index, tSec);
  const shimmer = 0.032 * Math.sin(tSec * 5.8 + index * 1.35);
  const idleGlow = clamp(
    chaseSoft * 0.84 + arc * 0.54 + shimmer * (0.32 + chaseSoft * 0.88),
    0,
    1.22
  );

  const winPulse = 1 + 0.028 * Math.sin(tSec * 8.5 + index * 1.05);
  const combined = clamp((1 - burstVal) * idleGlow + burstVal * winPulse, 0, 1.18);
  const glowMix = clamp(combined, 0, 1);

  const haloBoost = clamp(chaseSoft * 0.62 + Math.max(0, arc - 0.08) * 0.98, 0, 1.22);

  const scale = clamp(0.92 + 0.11 * glowMix + 0.08 * burstVal, 0.9, 1.09);

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
  hubX: number;
  hubY: number;
  baseR: number;
  clockMs: SharedValue<number>;
  chase: SharedValue<number>;
  chaseBoost: SharedValue<number>;
  burst: SharedValue<number>;
  palette: BulbRingPalette;
};

const NeoBulbCast = memo(function NeoBulbCast(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, chaseBoost, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { glowMix, scale, b } = bulbPhysics(
      index,
      bulbCount,
      t,
      chase.value,
      chaseBoost.value,
      burst.value
    );
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

/** Wide corona — cool when idle, warms with chase / arcs like lit glass. */
const NeoBulbHaloOuter = memo(function NeoBulbHaloOuter(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, chaseBoost, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, scale, haloBoost, chaseGlow } = bulbPhysics(
      index,
      bulbCount,
      t,
      chase.value,
      chaseBoost.value,
      burst.value
    );
    const chaseSoft = Math.pow(chaseGlow, 0.88);
    const warmMix = clamp(0.18 + 0.62 * chaseSoft + 0.42 * haloBoost, 0, 1);
    const fill = interpolateColor(
      warmMix,
      [0, 0.55, 1],
      [
        NeoBulbRingTheme.bulbHaloOuterCool,
        NeoBulbRingTheme.bulbLightningHaloMid,
        NeoBulbRingTheme.bulbLightningHalo,
      ]
    );
    const r = baseR * scale * 1.86;
    const pulse = 0.32 * chaseGlow + 0.68 * haloBoost;
    const op = clamp(pulse * (1 - b * 0.14) + b * 0.58, 0, 0.98);
    return { cx, cy, r, opacity: op, fill };
  }, [baseR, bulbCount, cx, cy, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

/** Inner bloom — chamomile core brightens with filament energy. */
const NeoBulbHaloInner = memo(function NeoBulbHaloInner(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, chaseBoost, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, scale, haloBoost, chaseGlow } = bulbPhysics(
      index,
      bulbCount,
      t,
      chase.value,
      chaseBoost.value,
      burst.value
    );
    const coreMix = clamp(0.28 + 0.72 * haloBoost + 0.22 * chaseGlow, 0, 1);
    const fill = interpolateColor(coreMix, [0, 1], [
      NeoBulbRingTheme.bulbLightningHaloMid,
      NeoBulbRingTheme.bulbLightningHaloCore,
    ]);
    const r = baseR * scale * 1.34;
    const op = clamp((0.24 + 0.58 * haloBoost + 0.38 * chaseGlow) * (1 - b * 0.1) + b * 0.42, 0, 0.94);
    return { cx, cy, r, opacity: op, fill };
  }, [baseR, bulbCount, cx, cy, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

/** Offset highlight toward hub — reads as curved glass, not flat candy dot. */
const NeoBulbGlint = memo(function NeoBulbGlint(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, hubX, hubY, baseR, clockMs, chase, chaseBoost, burst } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, glowMix, scale } = bulbPhysics(
      index,
      bulbCount,
      t,
      chase.value,
      chaseBoost.value,
      burst.value
    );
    const dx = hubX - cx;
    const dy = hubY - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const inset = baseR * scale * 0.36;
    const gx = cx + (dx / len) * inset;
    const gy = cy + (dy / len) * inset;
    const glint = clamp((glowMix - 0.32) * 1.15 + b * 0.42, 0, 1);
    const flicker = 0.06 * Math.sin(t * 11 + index * 0.9);
    const op = clamp(glint * (0.72 + flicker) + b * 0.28, 0, 0.92);
    return {
      cx: gx,
      cy: gy,
      r: baseR * scale * 0.19,
      opacity: op,
      fill: NeoBulbRingTheme.bulbGlassSpecular,
    };
  }, [baseR, bulbCount, cx, cy, hubX, hubY, index]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

const NeoBulbBody = memo(function NeoBulbBody(p: BulbBaseProps) {
  const { index, bulbCount, cx, cy, baseR, clockMs, chase, chaseBoost, burst, palette } = p;
  const animatedProps = useAnimatedProps(() => {
    const t = clockMs.value * 0.001;
    const { b, glowMix, scale } = bulbPhysics(
      index,
      bulbCount,
      t,
      chase.value,
      chaseBoost.value,
      burst.value
    );

    const bgIdle = interpolateColor(
      glowMix,
      [0, 0.22, 0.48, 0.74, 1],
      [
        palette.bulbDim,
        palette.bulbMid,
        NeoBulbRingTheme.bulbFilamentAmber,
        NeoBulbRingTheme.bulbHot,
        NeoBulbRingTheme.bulbShine,
      ]
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
    const strokeW = clamp(1.12 + 1.08 * b + glowMix * 0.58, 1, 3.1);

    return {
      cx,
      cy,
      r,
      opacity,
      fill: bgWin,
      stroke: borderWin,
      strokeWidth: strokeW,
    };
  }, [baseR, bulbCount, cx, cy, index, palette.bulbDim, palette.bulbMid]);

  return <AnimatedCircle animatedProps={animatedProps} />;
});

export type NeoBulbRingProps = {
  layout: BulbRingLayout;
  phase: BulbRingPhase;
  /** Wheel-themed ring + bulb base colors (defaults to money/green). */
  palette?: BulbRingPalette;
};

/**
 * Bulb ring around the prize disc — chase + victory flash; ring tint follows active wheel.
 */
export const NeoBulbRing = memo(function NeoBulbRing({ layout, phase, palette: paletteProp }: NeoBulbRingProps) {
  const palette = paletteProp ?? getBulbRingPalette("money");
  const gradId = useId().replace(/:/g, "");
  const bulbCount = layout.bulbs.length;
  const clockMs = useSharedValue(0);
  const chase = useSharedValue(0);
  const chaseBoost = useSharedValue(1);
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
    chaseBoost.value = withTiming(phase === "spinning" ? 1.52 : 1, {
      duration: phase === "spinning" ? 240 : 340,
      easing: Easing.out(Easing.cubic),
    });
  }, [phase]);

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
    const base = NeoWheel.segmentStrokeWidth;
    return {
      borderWidth: clamp(base + b * 2.15, base, base + 2.75),
      borderColor: interpolateColor(b, [0, 1], [NeoWheel.segmentStroke, NeoBulbRingTheme.ringBorderVictory]),
    };
  }, []);

  const common = { bulbCount, clockMs, chase, chaseBoost, burst, palette } as const;

  return (
    <View
      style={{
        width: d,
        height: d,
        position: "relative",
        borderRadius: d / 2,
        overflow: "hidden",
        backgroundColor: palette.ringFillShadow,
      }}
      pointerEvents="none"
    >
      <Svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} pointerEvents="none">
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" fx="50%" fy="50%" r="55%">
            <Stop offset="0%" stopColor={palette.ringFillHighlight} stopOpacity={1} />
            <Stop offset="52%" stopColor={palette.ringFill} stopOpacity={1} />
            <Stop offset="100%" stopColor={palette.ringFillShadow} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle cx={hubX} cy={hubY} r={d / 2} fill={`url(#${gradId})`} />
        {Array.from({ length: bulbCount }, (_, i) => {
          const a = bulbAngle(i, bulbCount);
          const cx = hubX + Math.cos(a) * orbit;
          const cy = hubY + Math.sin(a) * orbit;
          const bulbProps = { ...common, index: i, cx, cy, hubX, hubY, baseR: bulbR };
          return (
            <G key={i}>
              <NeoBulbCast {...bulbProps} />
              <NeoBulbHaloOuter {...bulbProps} />
              <NeoBulbHaloInner {...bulbProps} />
              <NeoBulbBody {...bulbProps} />
              <NeoBulbGlint {...bulbProps} />
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
            borderWidth: NeoWheel.segmentStrokeWidth,
            borderColor: NeoWheel.segmentStroke,
            backgroundColor: "transparent",
          },
        ]}
      />
    </View>
  );
});
