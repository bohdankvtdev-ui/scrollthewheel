import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { WHEEL_STAGES } from "../../game/loop";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";

type RunWheelBadgeProps = {
  run: RunState;
};

export function RunWheelBadge({ run }: RunWheelBadgeProps) {
  const wheel = run.wheels[run.wheelIndex];
  const role = wheel?.definition.role ?? "base";
  const stage = WHEEL_STAGES[role];
  const step = run.wheelIndex + 1;

  return (
    <View style={[styles.badge, { backgroundColor: stage.accent }]} pointerEvents="none">
      {stage.iconFamily === "MaterialCommunityIcons" ? (
        <MaterialCommunityIcons name={stage.icon as never} size={18} color={Neo.ink} />
      ) : (
        <MaterialIcons name={stage.icon as never} size={18} color={Neo.ink} />
      )}
      <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>{stage.label}</Text>
      <Text style={styles.step}>{step}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
  step: {
    fontSize: 12,
    color: Neo.ink,
    opacity: 0.65,
    fontWeight: "700",
  },
});
