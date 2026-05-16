import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";

type CompactStatPillProps = {
  icon: ReactNode;
  value: string | number;
  tint: string;
  accessibilityLabel: string;
  onPress?: () => void;
};

export function CompactStatPill({
  icon,
  value,
  tint,
  accessibilityLabel,
  onPress,
}: CompactStatPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: tint },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.val, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    minWidth: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    paddingHorizontal: 8,
  },
  icon: {
    width: 22,
    alignItems: "center",
  },
  val: {
    fontSize: 15,
    color: Neo.ink,
    letterSpacing: 0.25,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
});
