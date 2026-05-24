import { memo, useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { DollarParticleSpec } from "./homeFloatingDollars";

const COIN_GREEN = "#4ADE80";
const COIN_GREEN_DARK = "#22C55E";
const COIN_EDGE = "#14532D";

const GameDollarCoin = memo(function GameDollarCoin({ size }: { size: number }) {
  const fontSize = Math.round(size * 0.46);
  const ring = Math.max(2, size * 0.09);
  const inner = size - ring * 2.4;

  return (
    <View
      style={[
        styles.coin,
        { width: size, height: size, borderRadius: size / 2, borderWidth: ring },
      ]}
    >
      <View style={[styles.coinInner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        <Text style={[styles.dollarSign, { fontSize, lineHeight: fontSize + 2 }]}>$</Text>
      </View>
    </View>
  );
});

const FloatingDollar = memo(function FloatingDollar({
  spec,
  animate,
}: {
  spec: DollarParticleSpec;
  animate: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: spec.floatMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(progress);
  }, [animate, spec.floatMs]);

  const animStyle = useAnimatedStyle(() => {
    if (!animate) {
      return { opacity: spec.opacity };
    }
    const wave = progress.value * Math.PI * 2;
    return {
      opacity: spec.opacity,
      transform: [
        { translateX: Math.sin(wave) * spec.driftX },
        { translateY: Math.sin(wave + Math.PI / 2) * spec.driftY },
      ],
    };
  }, [animate, spec.driftX, spec.driftY, spec.opacity]);

  return (
    <Animated.View
      style={[
        styles.particle,
        animStyle,
        { left: spec.left, top: spec.top, width: spec.size, height: spec.size },
      ]}
    >
      <GameDollarCoin size={spec.size} />
    </Animated.View>
  );
});

type HomeFloatingDollarsProps = {
  dollars: DollarParticleSpec[];
  stageW: number;
  stageH: number;
  animate: boolean;
};

export const HomeFloatingDollars = memo(function HomeFloatingDollars({
  dollars,
  stageW,
  stageH,
  animate,
}: HomeFloatingDollarsProps) {
  const bg = useMemo(() => dollars.filter((d) => d.layer === "bg"), [dollars]);
  const fg = useMemo(() => dollars.filter((d) => d.layer === "fg"), [dollars]);

  return (
    <>
      <View style={[styles.zone, { width: stageW, height: stageH, zIndex: 1 }]} pointerEvents="none">
        {bg.map((p) => (
          <FloatingDollar key={p.id} spec={p} animate={animate} />
        ))}
      </View>
      <View style={[styles.zone, { width: stageW, height: stageH, zIndex: 6 }]} pointerEvents="none">
        {fg.map((p) => (
          <FloatingDollar key={p.id} spec={p} animate={animate} />
        ))}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  particle: { position: "absolute" },
  coin: {
    backgroundColor: COIN_GREEN,
    borderColor: COIN_EDGE,
    alignItems: "center",
    justifyContent: "center",
  },
  coinInner: {
    backgroundColor: COIN_GREEN_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  dollarSign: {
    color: "#ECFDF5",
    fontWeight: "900",
    textShadowColor: COIN_EDGE,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
