import { MaterialCommunityIcons, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo } from "../../theme/neoBrutal";
import type { SpinWheelIconFamily, SpinWheelItem } from "../types";

const ICON_PX = 22;
const DISC = 34;

export type SliceIconPlacement = {
  x: number;
  y: number;
};

function Glyph({
  family,
  name,
  color,
}: {
  family: SpinWheelIconFamily;
  name: string;
  color: string;
}) {
  if (family === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={ICON_PX}
        color={color}
      />
    );
  }
  if (family === "Ionicons") {
    return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={ICON_PX} color={color} />;
  }
  return <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={ICON_PX} color={color} />;
}

function isLossCaption(caption: string): boolean {
  return (
    caption.startsWith("-") ||
    caption === "ALL" ||
    (caption.includes("%") && !caption.startsWith("+") && caption !== "×2")
  );
}

/** Lightweight wedge labels — small disc + readable caption (GPU-friendly). */
export function SliceIconLayer({ size, data, placements }: { size: number; data: SpinWheelItem[]; placements: SliceIconPlacement[] }) {
  return (
    <View style={[styles.layer, { width: size, height: size }]} pointerEvents="none">
      {data.map((item, i) => {
        if (item.icon == null) return null;
        const pt = placements[i];
        if (pt == null) return null;
        const family = item.iconFamily ?? "MaterialIcons";
        const caption = item.shortLabel ?? item.label ?? "";
        const loss = isLossCaption(caption);

        return (
          <View
            key={item.id}
            style={[styles.marker, { left: pt.x - 30, top: pt.y - 22 }]}
          >
            <View
              style={[
                styles.disc,
                loss ? styles.discLoss : styles.discWin,
                item.iconTint != null && !loss ? { backgroundColor: item.iconTint } : null,
              ]}
            >
              <Glyph family={family} name={item.icon} color={loss ? "#FEE2E2" : Neo.ink} />
            </View>
            {caption ? (
              <Text style={[styles.caption, loss && styles.captionLoss]} numberOfLines={1}>
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
    width: 60,
    alignItems: "center",
    gap: 2,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    borderWidth: 2,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  discWin: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  discLoss: {
    backgroundColor: "rgba(15,15,15,0.88)",
  },
  caption: {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 10,
    letterSpacing: 0.35,
    color: Neo.ink,
    textAlign: "center",
    maxWidth: 58,
    textShadowColor: "rgba(255,255,255,0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  captionLoss: {
    color: "#FEE2E2",
    textShadowColor: "rgba(0,0,0,0.85)",
  },
});
