import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { RUN_PIPELINE, WHEEL_COUNT } from "../../data/wheels/runPipeline";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import type { RunState } from "../../schemas";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { RunProgressPips } from "./RunProgressPips";
import { formatMoney } from "../../utils/formatMoney";
import { WheelMapIcon } from "./WheelMapIcon";

type RunContextStripProps = {
  run: RunState;
};

export function RunContextStrip({ run }: RunContextStripProps) {
  const wheel = run.wheels[run.wheelIndex];
  const meta = getWheelArchetypeMetaForIndex(run.wheelIndex);
  const step = run.wheelIndex + 1;
  const pipelineDef = RUN_PIPELINE[run.wheelIndex];
  const title = pipelineDef?.title ?? wheel?.definition.title ?? "Wheel";
  const broke = run.money <= 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.main}>
        <View style={styles.topLine}>
          <View style={[styles.roleBadge, { backgroundColor: meta.accent }]}>
            <WheelMapIcon meta={meta} size={15} />
            <Text style={[styles.roleTag, { fontFamily: FONT_BEBAS_NEUE }]}>{meta.tag}</Text>
          </View>
          <View style={styles.cycleBadge}>
            <MaterialIcons name="autorenew" size={14} color={Neo.neonCyan} />
            <Text style={[styles.step, { fontFamily: FONT_BEBAS_NEUE }]}>
              {step}/{WHEEL_COUNT}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.bankRow}>
          <MaterialIcons name="attach-money" size={13} color={broke ? "#FF6B6B" : Neo.neonYellow} />
          <Text
            style={[
              styles.bankVal,
              { fontFamily: FONT_BEBAS_NEUE, color: broke ? "#FF6B6B" : Neo.neonYellow },
            ]}
          >
            {formatMoney(run.money)}
          </Text>
          {broke ? (
            <Text style={[styles.brokeHint, { fontFamily: FONT_BEBAS_NEUE }]}>BROKE</Text>
          ) : null}
        </View>
      </View>

      <RunProgressPips wheelIndex={run.wheelIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.context,
    backgroundColor: Neo.surfaceDark,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "space-between",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
    minHeight: 0,
  },
  topLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cycleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roleTag: {
    fontSize: 12,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
  step: {
    fontSize: 15,
    color: Neo.neonCyan,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 17,
    color: Neo.textOnDark,
    letterSpacing: 0.35,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 14,
  },
  bankVal: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  brokeHint: {
    fontSize: 11,
    color: "#FF6B6B",
    letterSpacing: 0.5,
  },
});
