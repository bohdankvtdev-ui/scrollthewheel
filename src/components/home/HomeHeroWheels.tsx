import { memo, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { HeroWheelSpec } from "./homeHeroWheels";
import { HomeFloatingDollars } from "./HomeFloatingDollars";
import { HomeMiniWheel } from "./HomeMiniWheel";
import { buildHomeStageLayout } from "./homeStageLayout";

const HeroWheelSlot = memo(function HeroWheelSlot({
  w,
  animate,
}: {
  w: HeroWheelSpec;
  animate: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: w.driftDurationMs,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    return () => cancelAnimation(progress);
  }, [animate, w.driftDurationMs, progress]);

  const driftStyle = useAnimatedStyle(() => {
    if (!animate) return {};
    const wave = progress.value * Math.PI * 2;
    return {
      transform: [
        { translateX: Math.sin(wave) * w.driftAmpX },
        { translateY: Math.sin(wave + Math.PI / 2) * w.driftAmpY },
      ],
    };
  }, [animate, w.driftAmpX, w.driftAmpY]);

  return (
    <Animated.View
      style={[
        styles.slot,
        driftStyle,
        {
          left: w.left,
          top: w.top,
          width: w.size,
          height: w.size,
          zIndex: w.zIndex,
        },
      ]}
    >
      <HomeMiniWheel
        size={w.size}
        durationMs={w.durationMs}
        reverse={w.reverse}
        colors={w.colors}
        sliceIcons={w.sliceIcons}
      />
    </Animated.View>
  );
});

const HomeHeroWheelsInner = memo(function HomeHeroWheelsInner({
  wheels,
  animate,
  stageW,
  stageH,
}: {
  wheels: HeroWheelSpec[];
  animate: boolean;
  stageW: number;
  stageH: number;
}) {
  return (
    <View style={[styles.stage, { width: stageW, height: stageH }]} pointerEvents="none">
      {wheels.map((w) => (
        <HeroWheelSlot key={w.id} w={w} animate={animate} />
      ))}
    </View>
  );
});

export function HomeHeroStage() {
  const { width, height } = useWindowDimensions();
  const [animate, setAnimate] = useState(true);

  const layout = useMemo(() => buildHomeStageLayout(width, height), [width, height]);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!cancelled) setAnimate(!reduced);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.stageWrap, { width, height }]} pointerEvents="none">
      <HomeFloatingDollars
        dollars={layout.dollars}
        stageW={layout.width}
        stageH={layout.height}
        animate={animate}
      />
      <HomeHeroWheelsInner
        wheels={layout.wheels}
        animate={animate}
        stageW={layout.width}
        stageH={layout.height}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stageWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 5,
  },
  stage: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 7,
  },
  slot: {
    position: "absolute",
  },
});
