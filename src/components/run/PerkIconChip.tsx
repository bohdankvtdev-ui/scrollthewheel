import { Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { Neo } from "../../../theme/neoBrutal";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import type { IconFamily } from "../../schemas";

const SLOT = 44;

export type LoadoutChipVariant = "good" | "bad";

const VARIANT_STYLE: Record<
  LoadoutChipVariant,
  { tint: string; iconColor: string; highlightBorder: string; highlightBg: string }
> = {
  good: {
    tint: "#BBF7D0",
    iconColor: "#14532D",
    highlightBorder: Neo.neonYellow,
    highlightBg: "rgba(74,222,128,0.2)",
  },
  bad: {
    tint: "#FECACA",
    iconColor: "#991B1B",
    highlightBorder: "#F87171",
    highlightBg: "rgba(248,113,113,0.22)",
  },
};

type PerkIconChipProps = {
  icon: string;
  iconFamily: IconFamily;
  /** Green perk vs red curse styling */
  variant?: LoadoutChipVariant;
  tier?: number;
  selected?: boolean;
  highlighted?: boolean;
  animateEnter?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function PerkIconChip({
  icon,
  iconFamily,
  variant = "good",
  tier: _tier = 0,
  selected,
  highlighted,
  animateEnter = false,
  onPress,
  accessibilityLabel = "View effect",
}: PerkIconChipProps) {
  const palette = VARIANT_STYLE[variant];
  const showAccent = selected || highlighted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <Animated.View
        entering={
          animateEnter
            ? ZoomIn.springify().damping(16).stiffness(240).duration(280)
            : FadeIn.duration(100)
        }
        style={[
          styles.glyphWrap,
          { borderColor: showAccent ? palette.highlightBorder : "transparent", backgroundColor: showAccent ? palette.highlightBg : "transparent" },
        ]}
      >
        <PrizeGlyph
          icon={icon}
          iconFamily={iconFamily}
          size="sm"
          tint={palette.tint}
          tone={variant === "bad" ? "curse" : "perk"}
          iconColor={palette.iconColor}
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
    overflow: "hidden",
  },
  glyphWrap: {
    width: SLOT,
    height: SLOT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
