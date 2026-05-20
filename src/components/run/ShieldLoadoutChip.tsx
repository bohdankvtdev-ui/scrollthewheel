import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PerkIconChip } from "./PerkIconChip";

type ShieldLoadoutChipProps = {
  count: number;
};

/** Shield stack in loadout — fades out when a shield is consumed. */
export function ShieldLoadoutChip({ count }: ShieldLoadoutChipProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const fade = useSharedValue(1);
  const scale = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count < prevCount.current) {
      fade.value = withSequence(withTiming(1, { duration: 40 }), withTiming(0, { duration: 420 }));
      scale.value = withSequence(
        withTiming(1.18, { duration: 120 }),
        withTiming(0.82, { duration: 380 })
      );
      const t = setTimeout(() => {
        setDisplayCount(count);
        fade.value = 1;
        scale.value = 1;
      }, 440);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
    setDisplayCount(count);
    fade.value = 1;
    scale.value = 1;
  }, [count, fade, scale]);

  if (displayCount <= 0) return null;

  const animStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrap, animStyle]}
      accessibilityLabel={`${displayCount} shields`}
    >
      <PerkIconChip
        icon="shield-check"
        iconFamily="MaterialCommunityIcons"
        variant="good"
        onPress={() => {}}
        accessibilityLabel={`${displayCount} shields`}
      />
      {displayCount > 1 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Neo.neonCyan,
    borderWidth: 1,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT_BEBAS_NEUE,
    color: Neo.ink,
  },
});
