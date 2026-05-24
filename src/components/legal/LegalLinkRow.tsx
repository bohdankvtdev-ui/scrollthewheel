import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { LegalLinkItem } from "../../constants/legalLinks";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";

export function LegalLinkRow({ item }: { item: LegalLinkItem }) {
  const router = useRouter();

  const onPress = () => {
    if (item.url) {
      void Linking.openURL(item.url);
      return;
    }
    if (item.route) {
      router.push(item.route);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <MaterialIcons name={item.icon} size={22} color={Neo.ink} />
      <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>{item.label}</Text>
      <MaterialIcons name="chevron-right" size={22} color={Neo.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 12,
  },
  rowPressed: {
    opacity: 0.92,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  label: {
    flex: 1,
    fontSize: 17,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
});
