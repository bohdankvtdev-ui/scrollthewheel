import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import type { SliceVisualTone } from "../../game/content/sliceVisualTheme";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { IconFamily } from "../../schemas";

type EffectIconProps = {
  icon: string;
  iconFamily: IconFamily;
  effectHint: string;
  size?: "sm" | "md" | "lg";
  accentBg?: string;
  iconColor?: string;
  tone?: SliceVisualTone;
  borderColor?: string;
  onPress?: () => void;
  selected?: boolean;
};

const GLYPH_SIZE = { sm: "xs" as const, md: "sm" as const, lg: "md" as const };

export function EffectIcon({
  icon,
  iconFamily,
  effectHint,
  size = "md",
  accentBg = Neo.neonYellow,
  iconColor,
  tone = "gain",
  borderColor = Neo.ink,
  onPress,
  selected = false,
}: EffectIconProps) {
  const body = (
    <View
      style={[
        styles.box,
        {
          borderColor: selected ? Neo.accent : borderColor,
          borderWidth: selected ? Neo.borderBold : Neo.borderThin,
        },
      ]}
    >
      <PrizeGlyph
        icon={icon}
        iconFamily={iconFamily}
        size={GLYPH_SIZE[size]}
        tint={accentBg}
        iconColor={iconColor}
        tone={tone}
      />
      <Text style={styles.hint} numberOfLines={2}>
        {effectHint}
      </Text>
    </View>
  );

  if (onPress == null) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={effectHint}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 72,
    maxWidth: 88,
    gap: 6,
    backgroundColor: "transparent",
  },
  hint: {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 10,
    lineHeight: 12,
    color: Neo.ink,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
});
