import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  ZoomIn,
} from "react-native-reanimated";
import { Neo } from "../../../theme/neoBrutal";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import type { IconFamily } from "../../schemas";

const SLOT = 44;

const TIER_TINT: Record<number, string> = {
  0: "#FEF9C3",
  1: "#BBF7D0",
  2: "#E9D5FF",
  3: "#FEF08A",
};

type PerkIconChipProps = {
  icon: string;
  iconFamily: IconFamily;
  tier?: number;
  selected?: boolean;
  highlighted?: boolean;
  /** Play a one-shot pop-in when this perk was just won. */
  animateEnter?: boolean;
  onPress: () => void;
};

export function PerkIconChip({
  icon,
  iconFamily,
  tier = 0,
  selected,
  highlighted,
  animateEnter = false,
  onPress,
}: PerkIconChipProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!highlighted) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withSpring(1.08, { damping: 10, stiffness: 180 }), withSpring(1, { damping: 12 })),
      2,
      false
    );
  }, [highlighted, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: highlighted ? 1 : 0,
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View perk"
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <Animated.View pointerEvents="none" style={[styles.highlightRing, ringStyle]} />
      <Animated.View
        entering={animateEnter ? ZoomIn.springify().damping(14).stiffness(200).duration(340) : FadeIn.duration(120)}
        style={styles.glyphWrap}
      >
        <PrizeGlyph
          icon={icon}
          iconFamily={iconFamily}
          size="sm"
          tint={TIER_TINT[tier] ?? TIER_TINT[0]}
          style={selected ? styles.selectedRing : undefined}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: SLOT,
    height: SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  glyphWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  highlightRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Neo.neonYellow,
    backgroundColor: "rgba(255,233,77,0.14)",
  },
  selectedRing: {
    borderColor: Neo.neonYellow,
    borderWidth: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
