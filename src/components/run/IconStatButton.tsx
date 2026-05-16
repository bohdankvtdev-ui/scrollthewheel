import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";

type IconStatButtonProps = {
  icon: ReactNode;
  value: string | number;
  tint: string;
  onPress?: () => void;
  accessibilityLabel: string;
};

export function IconStatButton({ icon, value, tint, onPress, accessibilityLabel }: IconStatButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: tint },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.val, { fontFamily: FONT_BEBAS_NEUE }]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconWrap: {
    height: 26,
    justifyContent: "center",
  },
  val: {
    fontSize: 11,
    color: Neo.ink,
    letterSpacing: 0.2,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    opacity: 0.92,
  },
});
