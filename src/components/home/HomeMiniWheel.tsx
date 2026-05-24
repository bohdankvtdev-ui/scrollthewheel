import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import type { ComponentProps } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";
import { NeoBulbRingTheme } from "../../../theme/neoBrutal";

const SLICES = 6;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg - 90);
  const end = polar(cx, cy, r, endDeg - 90);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type HomeMiniWheelProps = {
  size: number;
  colors?: readonly string[];
  durationMs?: number;
  reverse?: boolean;
  opacity?: number;
  sliceIcons?: readonly IconName[];
};

export function HomeMiniWheel({
  size,
  colors = T.wheelSlices,
  durationMs = 9000,
  reverse = false,
  opacity = 1,
  sliceIcons,
}: HomeMiniWheelProps) {
  const spin = useSharedValue(0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const step = 360 / SLICES;
  const stroke = size > 100 ? 3 : 2.5;

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced) return;
      spin.value = withRepeat(
        withTiming(reverse ? -360 : 360, {
          duration: durationMs,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    });
    return () => {
      cancelled = true;
      cancelAnimation(spin);
    };
  }, [spin, durationMs, reverse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const iconSize = Math.max(14, Math.round(size * 0.11));
  const hubSize = size * 0.24;
  const hubRadius = hubSize / 2;

  return (
    <View style={[styles.shell, { width: size, height: size, opacity }]}>
      <Animated.View style={[styles.spinner, spinStyle, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G>
            {Array.from({ length: SLICES }, (_, i) => (
              <Path
                key={i}
                d={slicePath(cx, cy, r, i * step, (i + 1) * step)}
                fill={colors[i % colors.length]}
                stroke={T.ink}
                strokeWidth={stroke}
              />
            ))}
          </G>
        </Svg>
        {sliceIcons != null
          ? Array.from({ length: SLICES }, (_, i) => {
              const midDeg = i * step + step / 2 - 90;
              const rad = (midDeg * Math.PI) / 180;
              const iconR = r * 0.62;
              const ix = cx + iconR * Math.cos(rad) - iconSize / 2;
              const iy = cy + iconR * Math.sin(rad) - iconSize / 2;
              const name = sliceIcons[i % sliceIcons.length] ?? "star-four-points";
              return (
                <View key={`icon-${i}`} style={[styles.sliceIcon, { left: ix, top: iy }]}>
                  <MaterialCommunityIcons name={name} size={iconSize} color={T.ink} />
                </View>
              );
            })
          : null}
      </Animated.View>
      <View
        style={[
          styles.hub,
          {
            width: hubSize,
            height: hubSize,
            borderRadius: hubRadius,
            left: (size - hubSize) / 2,
            top: (size - hubSize) / 2,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="play"
          size={Math.max(14, Math.round(hubSize * 0.42))}
          color="#FFFFFF"
          style={styles.playIcon}
        />
      </View>
      <View
        style={[
          styles.rim,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size > 100 ? T.borderBold : T.borderThin,
          },
        ]}
      />
      <View
        style={[
          styles.outerGlow,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            left: -4,
            top: -4,
            backgroundColor: `${NeoBulbRingTheme.ringFill}22`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
  },
  spinner: {
    position: "relative",
  },
  sliceIcon: {
    position: "absolute",
    zIndex: 1,
  },
  outerGlow: {
    position: "absolute",
    zIndex: -1,
  },
  rim: {
    position: "absolute",
    borderColor: T.ink,
  },
  hub: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HomePalette.red,
    borderWidth: 2.5,
    borderColor: T.ink,
    zIndex: 2,
  },
  playIcon: {
    marginLeft: 2,
  },
});
