import { MaterialCommunityIcons, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { Neo } from "../../theme/neoBrutal";

export type PrizeGlyphFamily = "MaterialIcons" | "MaterialCommunityIcons" | "Ionicons";

type PrizeGlyphProps = {
  icon: string;
  iconFamily?: PrizeGlyphFamily;
  size?: "xs" | "sm" | "md";
  tint?: string;
  variant?: "default" | "loss" | "jackpot";
  style?: ViewStyle;
};

const SIZES = {
  xs: { box: 30, glyph: 17, radius: 8 },
  sm: { box: 36, glyph: 20, radius: 10 },
  md: { box: 42, glyph: 24, radius: 11 },
} as const;

function Glyph({
  family,
  name,
  size,
  color,
}: {
  family: PrizeGlyphFamily;
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

/** Compact badge for loadout / shop — flat, no shadows. */
export function PrizeGlyph({
  icon,
  iconFamily = "MaterialIcons",
  size = "sm",
  tint,
  variant = "default",
  style,
}: PrizeGlyphProps) {
  const dim = SIZES[size];
  const bg =
    tint ?? (variant === "loss" ? "#FECACA" : variant === "jackpot" ? "#FEF08A" : "#FFF7D6");
  const fg = variant === "loss" ? "#991B1B" : Neo.ink;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: dim.box,
          height: dim.box,
          borderRadius: dim.radius,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Glyph family={iconFamily} name={icon} size={dim.glyph} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Neo.ink,
  },
});
