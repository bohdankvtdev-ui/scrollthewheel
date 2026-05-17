import { MaterialCommunityIcons, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, type ViewStyle } from "react-native";
import type { SliceVisualTone } from "../../src/game/content/sliceVisualTheme";
import { Neo } from "../../theme/neoBrutal";

export type PrizeGlyphFamily = "MaterialIcons" | "MaterialCommunityIcons" | "Ionicons";

type PrizeGlyphProps = {
  icon: string;
  iconFamily?: PrizeGlyphFamily;
  size?: "xs" | "sm" | "md";
  tint?: string;
  iconColor?: string;
  tone?: SliceVisualTone;
  variant?: "default" | "loss" | "jackpot";
  style?: ViewStyle;
};

const SIZES = {
  xs: { box: 30, glyph: 17, radius: 7 },
  sm: { box: 36, glyph: 20, radius: 8 },
  md: { box: 44, glyph: 24, radius: 9 },
} as const;

const TONE_CHIP: Record<SliceVisualTone, { bg: string; fg: string }> = {
  gain: { bg: "#FEF9C3", fg: "#14532D" },
  loss: { bg: "#FEE2E2", fg: "#7F1D1D" },
  stakes: { bg: "#FFEDD5", fg: "#9A3412" },
  jackpot: { bg: "#FEF08A", fg: "#713F12" },
  perk: { bg: "#EDE9FE", fg: "#4C1D95" },
  deck: { bg: "#CFFAFE", fg: "#155E75" },
  curse: { bg: "#E7E5E4", fg: "#44403C" },
  neutral: { bg: "#F3F4F6", fg: "#374151" },
};

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

/** Flat neo-brutal icon chip — rounded square, no circle pills. */
export function PrizeGlyph({
  icon,
  iconFamily = "MaterialIcons",
  size = "sm",
  tint,
  iconColor,
  tone = "gain",
  variant = "default",
  style,
}: PrizeGlyphProps) {
  const dim = SIZES[size];
  const toneColors = TONE_CHIP[tone];
  const bg =
    tint ??
    (variant === "loss" ? TONE_CHIP.loss.bg : variant === "jackpot" ? TONE_CHIP.jackpot.bg : toneColors.bg);
  const fg =
    iconColor ??
    (variant === "loss" ? TONE_CHIP.loss.fg : variant === "jackpot" ? TONE_CHIP.jackpot.fg : toneColors.fg);

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
