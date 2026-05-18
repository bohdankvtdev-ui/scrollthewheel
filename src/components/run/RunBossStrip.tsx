import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";

type RunStakesStripProps = {
  run: RunState;
};

/** High-stakes money warning on Showdown / Final Table wheels. */
export function RunBossStrip({ run }: RunStakesStripProps) {
  const role = run.wheels[run.wheelIndex]?.definition.role;
  const isStakes = role === "boss" || role === "mini_boss";

  if (!isStakes) {
    return <View style={styles.placeholder} />;
  }

  const isFinal = role === "boss";

  return (
    <View style={[styles.wrap, isFinal && styles.wrapFinal]}>
      <MaterialIcons name="warning" size={18} color={Neo.neonYellow} />
      <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>
        {isFinal
          ? "SHOWDOWN — taxes your bank & jokers you bought"
          : "STAKES WHEEL — % of bank on the line"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { height: 0, overflow: "hidden" },
  wrap: {
    height: RUN_LAYOUT.bossStrip,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,45,85,0.12)",
    borderBottomWidth: Neo.borderThin,
    borderBottomColor: Neo.ink,
  },
  wrapFinal: {
    backgroundColor: "rgba(255,233,77,0.12)",
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: Neo.textOnDark,
    letterSpacing: 0.3,
  },
});
