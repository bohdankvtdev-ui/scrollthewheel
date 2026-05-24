import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";

type GuideScreenHeaderProps = {
  title: string;
  onBack: () => void;
  right?: ReactNode;
};

export function GuideScreenHeader({ title, onBack, right }: GuideScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={22} color={Neo.textOnDark} />
      </Pressable>
      <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={styles.backSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    backgroundColor: Neo.headerBg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  backPressed: { opacity: 0.85 },
  title: {
    flex: 1,
    fontSize: 22,
    color: Neo.textOnDark,
    letterSpacing: 0.4,
  },
  right: { minWidth: 40, alignItems: "flex-end" },
  backSpacer: { width: 40 },
});
