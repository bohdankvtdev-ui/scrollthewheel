import { memo } from "react";
import { VectorIcon } from "../../lib/ui/VectorIcon";
import { StyleSheet, Text, View } from "react-native";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import type { SpinWheelIconFamily, SpinWheelItem } from "../types";

function iconSizeForWheel(wheelSize: number, scale = 1): number {
  return Math.round(Math.min(58, Math.max(34, wheelSize * 0.108)) * scale);
}

function captionSizeForWheel(wheelSize: number, scale = 1): number {
  return Math.round(Math.min(20, Math.max(12, wheelSize * 0.044)) * scale);
}

export type SliceIconPlacement = {
  x: number;
  y: number;
};

/** Wedge icons + captions — complementary colors, no glow. */
export const SliceIconLayer = memo(function SliceIconLayer({
  size,
  data,
  placements,
  iconScale = 1,
}: {
  size: number;
  data: SpinWheelItem[];
  placements: SliceIconPlacement[];
  /** e.g. 1.45 for 2-slice gamble wheel */
  iconScale?: number;
}) {
  const iconPx = iconSizeForWheel(size, iconScale);
  const captionPx = captionSizeForWheel(size, iconScale);
  const markerW = Math.round(iconPx * 2.35);

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
            <VectorIcon family={family} name={item.icon} color={iconColor} size={iconPx} />
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
});

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
