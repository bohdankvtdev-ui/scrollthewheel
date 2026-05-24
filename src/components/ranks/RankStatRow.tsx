import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";

export function RankStatCell({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.cell, last && styles.cellLast]}>
      <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>{label}</Text>
      <Text
        style={[styles.value, { fontFamily: FONT_BEBAS_NEUE, color: accent ?? "#FAFAFA" }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {value}
      </Text>
    </View>
  );
}

export function RankStatRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: Neo.radiusCard,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    overflow: "hidden",
  },
  cell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: "rgba(250,250,250,0.08)",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  label: {
    fontSize: 9,
    color: Neo.neonCyan,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 17,
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
