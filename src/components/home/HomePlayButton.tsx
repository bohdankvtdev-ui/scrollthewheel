import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { homeBrutalButton, HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HomePlayButtonProps = {
  onPress: () => void;
  animate?: boolean;
  uiScale?: number;
};

export function HomePlayButton({ onPress, animate = true, uiScale = 1 }: HomePlayButtonProps) {
  const press = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      false
    );
    return () => cancelAnimation(pulse);
  }, [animate, pulse]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: animate ? pulse.value : 1 },
      { translateX: press.value * 4 },
      { translateY: press.value * 4 },
    ],
  }));

  return (
    <AnimatedPressable
      style={[
        homeBrutalButton(HomePalette.red, {
          ...styles.btn,
          minWidth: Math.round(220 * uiScale),
          paddingVertical: Math.round(18 * uiScale),
          paddingHorizontal: Math.round(36 * uiScale),
        }),
        pressStyle,
      ]}
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 18, stiffness: 400 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 16, stiffness: 320 });
      }}
      accessibilityRole="button"
      accessibilityLabel="Play game"
      accessibilityHint="Starts a new run"
    >
      <View style={styles.row}>
        <MaterialCommunityIcons name="play" size={Math.round(28 * uiScale)} color="#FAFAFA" />
        <Text
          style={[
            styles.label,
            { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(34 * uiScale) },
          ]}
        >
          Play
        </Text>
      </View>
      <Text
        style={[
          styles.sub,
          { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(12 * uiScale) },
        ]}
      >
        Start a new game
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    gap: 4,
    zIndex: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#FAFAFA",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sub: {
    color: "rgba(250,250,250,0.82)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
