import { MaterialCommunityIcons, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { IconFamily } from "../../schemas";

type EffectIconProps = {
  icon: string;
  iconFamily: IconFamily;
  effectHint: string;
  size?: "sm" | "md" | "lg";
  accentBg?: string;
  borderColor?: string;
  onPress?: () => void;
  selected?: boolean;
};

function Glyph({
  family,
  name,
  size,
  color,
}: {
  family: IconFamily;
  name: string;
  size: number;
  color: string;
}) {
  if (family === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }
  if (family === "Ionicons") {
    return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
  }
  return <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={size} color={color} />;
}

const SIZES = { sm: 22, md: 28, lg: 36 } as const;

export function EffectIcon({
  icon,
  iconFamily,
  effectHint,
  size = "md",
  accentBg = Neo.neonYellow,
  borderColor = Neo.ink,
  onPress,
  selected = false,
}: EffectIconProps) {
  const iconPx = SIZES[size];
  const body = (
    <View
      style={[
        styles.box,
        {
          backgroundColor: accentBg,
          borderColor: selected ? Neo.accent : borderColor,
          borderWidth: selected ? Neo.borderBold : Neo.borderThin,
        },
      ]}
    >
      <Glyph family={iconFamily} name={icon} size={iconPx} color={Neo.ink} />
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
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 72,
    maxWidth: 88,
    gap: 4,
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
