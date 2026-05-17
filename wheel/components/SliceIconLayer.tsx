import { MaterialCommunityIcons, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import type { SpinWheelIconFamily, SpinWheelItem } from "../types";

function iconSizeForWheel(wheelSize: number): number {
  return Math.round(Math.min(46, Math.max(34, wheelSize * 0.108)));
}

function captionSizeForWheel(wheelSize: number): number {
  return Math.round(Math.min(16, Math.max(12, wheelSize * 0.044)));
}

export type SliceIconPlacement = {
  x: number;
  y: number;
};

function Glyph({
  family,
  name,
  color,
  size,
}: {
  family: SpinWheelIconFamily;
  name: string;
  color: string;
  size: number;
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

/** Wedge icons + captions — complementary colors, no glow. */
export function SliceIconLayer({
  size,
  data,
  placements,
}: {
  size: number;
  data: SpinWheelItem[];
  placements: SliceIconPlacement[];
}) {
  const iconPx = iconSizeForWheel(size);
  const captionPx = captionSizeForWheel(size);
  const markerW = Math.round(iconPx * 2.2);

  return (
    <View style={[styles.layer, { width: size, height: size }]} pointerEvents="none">
      {data.map((item, i) => {
        if (item.icon == null) return null;
        const pt = placements[i];
        if (pt == null) return null;
        const family = item.iconFamily ?? "MaterialIcons";
        const caption = item.shortLabel ?? item.label ?? "";
        const iconColor = item.iconColor ?? "#1F2937";
        const captionColor = item.captionColor ?? iconColor;

        return (
          <View
            key={item.id}
            style={[
              styles.marker,
              {
                width: markerW,
                left: pt.x - markerW / 2,
                top: pt.y - iconPx * 0.88,
              },
            ]}
          >
            <Glyph family={family} name={item.icon} color={iconColor} size={iconPx} />
            {caption ? (
              <Text
                style={[styles.caption, { fontSize: captionPx, maxWidth: markerW + 6, color: captionColor }]}
                numberOfLines={1}
              >
                {caption}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  marker: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
  },
  caption: {
    fontFamily: FONT_BEBAS_NEUE,
    letterSpacing: 0.55,
    textAlign: "center",
    fontWeight: "700",
  },
});
