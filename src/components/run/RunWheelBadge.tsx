import { StyleSheet, Text, View } from "react-native";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { WheelMapIcon } from "./WheelMapIcon";

type RunWheelBadgeProps = {
  run: RunState;
};

export function RunWheelBadge({ run }: RunWheelBadgeProps) {
  const meta = getWheelArchetypeMetaForIndex(run.wheelIndex);
  const step = run.wheelIndex + 1;

  return (
    <View style={[styles.badge, { backgroundColor: meta.accent }]} pointerEvents="none">
      <WheelMapIcon meta={meta} size={18} />
      <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>{meta.mapLabel}</Text>
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
