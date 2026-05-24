import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { buildDecorWheels, type DecorWheelSpec } from "./homeDecorWheels";
import { HomeMiniWheel } from "./HomeMiniWheel";

/** Quantize layout so minor keyboard/layout ticks don't rebuild positions. */
function stableLayoutSize(n: number): number {
  return Math.round(n / 24) * 24;
}

function FloatingWheelSlot({ w }: { w: DecorWheelSpec }) {
  const progress = useSharedValue(w.driftPhase);

  useEffect(() => {
    progress.value = w.driftPhase;
    progress.value = withRepeat(
      withTiming(w.driftPhase + 1, {
        duration: w.driftDurationMs,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [w.driftDurationMs, w.driftPhase, progress]);

  const driftStyle = useAnimatedStyle(() => {
    const wave = progress.value * Math.PI * 2;
    return {
      transform: [
        { translateX: Math.sin(wave) * w.driftAmpX },
        { translateY: Math.cos(wave) * w.driftAmpY },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.slot,
        driftStyle,
        { left: w.left, top: w.top, width: w.size, height: w.size },
      ]}
    >
      <HomeMiniWheel
        size={w.size}
        durationMs={w.durationMs}
        reverse={w.reverse}
        opacity={w.opacity}
        colors={w.colors}
      />
    </Animated.View>
  );
}

/** Three large decor wheels — fixed corners/edges, smooth float loop. */
export function HomeSpinningWheels() {
  const { width, height } = useWindowDimensions();
  const layoutW = stableLayoutSize(width);
  const layoutH = stableLayoutSize(height);

  const wheels = useMemo(
    () => buildDecorWheels(layoutW, layoutH),
    [layoutW, layoutH]
  );

  return (
    <View style={[styles.zone, { width, height }]} pointerEvents="none">
      {wheels.map((w) => (
        <FloatingWheelSlot key={w.id} w={w} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  slot: {
    position: "absolute",
  },
});
