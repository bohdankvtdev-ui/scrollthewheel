import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import type { IconFamily } from "../../schemas";

const DEFAULT_SLOT = 44;

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
  /** Chip outer size — defaults to phone loadout slot. */
  size?: number;
  /** Green perk vs red curse styling */
  variant?: LoadoutChipVariant;
  /** Perk family colors — overrides default green when set */
  familyTint?: string;
  familyIconColor?: string;
  familyHighlight?: string;
  tier?: number;
  stackCount?: number;
  selected?: boolean;
  highlighted?: boolean;
  animateEnter?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function PerkIconChip({
  icon,
  iconFamily,
  size = DEFAULT_SLOT,
  variant = "good",
  familyTint,
  familyIconColor,
  familyHighlight,
  tier: _tier = 0,
  stackCount = 1,
  selected,
  highlighted,
  animateEnter = false,
  onPress,
  accessibilityLabel = "View effect",
}: PerkIconChipProps) {
  const palette = VARIANT_STYLE[variant];
  const tint = familyTint ?? palette.tint;
  const iconColor = familyIconColor ?? palette.iconColor;
  const highlightBorder = familyHighlight ?? palette.highlightBorder;
  const showAccent = selected || highlighted;
  const showBadge = stackCount > 1;
  const badgeSize = Math.max(16, Math.round(size * 0.4));
  const badgeFontSize = Math.max(10, Math.round(size * 0.24));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.slot, { width: size, height: size }, pressed && styles.pressed]}
    >
      <Animated.View
        entering={
          animateEnter
            ? SlideInRight.springify().damping(18).stiffness(280).duration(220)
            : FadeIn.duration(100)
        }
        style={[
          styles.glyphWrap,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.27),
            borderColor: showAccent ? highlightBorder : "transparent",
            backgroundColor: showAccent ? palette.highlightBg : "transparent",
          },
        ]}
      >
        <PrizeGlyph
          icon={icon}
          iconFamily={iconFamily}
          size="sm"
          tint={tint}
          tone={variant === "bad" ? "curse" : "perk"}
          iconColor={iconColor}
        />
        {showBadge ? (
          <View
            style={[
              styles.badge,
              variant === "bad" ? styles.badgeBad : styles.badgeGood,
              {
                minWidth: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { fontFamily: FONT_BEBAS_NEUE, fontSize: badgeFontSize, lineHeight: badgeFontSize + 2 },
              ]}
            >
              {stackCount}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  glyphWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "visible",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  badge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Neo.ink,
  },
  badgeGood: {
    backgroundColor: Neo.neonYellow,
  },
  badgeBad: {
    backgroundColor: "#FCA5A5",
  },
  badgeText: {
    color: Neo.ink,
    letterSpacing: 0.2,
  },
});
