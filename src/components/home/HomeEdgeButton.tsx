import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { homeBrutalButton, HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HomeEdgeButtonProps = {
  icon: IconName;
  label: string;
  /** Short plain-English hint under the icon label. */
  hint?: string;
  accent: string;
  onPress: () => void;
  size?: "md" | "lg";
  uiScale?: number;
};

export function HomeEdgeButton({
  icon,
  label,
  hint,
  accent,
  onPress,
  size = "md",
  uiScale = 1,
}: HomeEdgeButtonProps) {
  const pressed = useSharedValue(0);
  const baseDim = size === "lg" ? 68 : 62;
  const dim = Math.round(baseDim * uiScale);
  const iconSize = Math.round((size === "lg" ? 28 : 24) * uiScale);

  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressed.value * 3 },
      { translateY: pressed.value * 3 },
    ],
  }));

  return (
    <AnimatedPressable
      style={[homeBrutalButton(accent, { width: dim, height: dim, borderRadius: dim / 2 }), anim]}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 18, stiffness: 400 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 16, stiffness: 320 });
      }}
      accessibilityRole="button"
      accessibilityLabel={hint != null ? `${label}. ${hint}` : label}
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons name={icon} size={iconSize} color={T.ink} />
        <Text
          style={[
            styles.label,
            {
              fontFamily: FONT_BEBAS_NEUE,
              fontSize: Math.round(8 * uiScale),
              lineHeight: Math.round(10 * uiScale),
              maxWidth: Math.round(58 * uiScale),
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function HomeMiniStat({
  label,
  value,
  uiScale = 1,
}: {
  label: string;
  value: string;
  uiScale?: number;
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={[
          styles.statLabel,
          { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(9 * uiScale) },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.statValue,
          { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(18 * uiScale) },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 8,
    color: T.ink,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    maxWidth: 58,
    textAlign: "center",
    lineHeight: 10,
  },
  stat: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: T.borderThin,
    borderColor: "rgba(250,250,250,0.15)",
    backgroundColor: "rgba(0,0,0,0.35)",
    minWidth: 72,
  },
  statLabel: {
    fontSize: 8,
    color: HomePalette.cyan,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  statValue: {
    fontSize: 15,
    color: T.textOnDark,
    letterSpacing: 0.3,
  },
});
