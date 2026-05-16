import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { WHEEL_ROLE_META } from "../../data/wheelRoleMeta";
import { RUN_PIPELINE, WHEEL_COUNT } from "../../data/wheels/runPipeline";
import type { RunState } from "../../schemas";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { RunProgressPips } from "./RunProgressPips";

type RunContextStripProps = {
  run: RunState;
};

export function RunContextStrip({ run }: RunContextStripProps) {
  const wheel = run.wheels[run.wheelIndex];
  const role = wheel?.definition.role ?? "base";
  const meta = WHEEL_ROLE_META[role];
  const step = run.wheelIndex + 1;
  const pipelineDef = RUN_PIPELINE[run.wheelIndex];
  const title = pipelineDef?.title ?? wheel?.definition.title ?? "Wheel";
  const showBoss = role === "boss" || role === "mini_boss";
  const bossPct = showBoss ? Math.min(100, Math.max(8, (run.money / 500) * 100)) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.main}>
        <View style={styles.topLine}>
          <View style={[styles.roleBadge, { backgroundColor: meta.accent }]}>
            {meta.iconFamily === "MaterialCommunityIcons" ? (
              <MaterialCommunityIcons name={meta.icon as never} size={15} color={Neo.ink} />
            ) : (
              <MaterialIcons name={meta.icon as never} size={15} color={Neo.ink} />
            )}
            <Text style={[styles.roleTag, { fontFamily: FONT_BEBAS_NEUE }]}>{meta.tag}</Text>
          </View>
          <Text style={[styles.step, { fontFamily: FONT_BEBAS_NEUE }]}>
            {step}/{WHEEL_COUNT}
          </Text>
        </View>

        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={[styles.bossRow, !showBoss && styles.bossHidden]}>
          <MaterialIcons name="sports-kabaddi" size={13} color={Neo.neonYellow} />
          <View style={styles.bossTrack}>
            <View style={[styles.bossFill, { width: `${bossPct}%` }]} />
          </View>
          <Text style={[styles.bossHp, { fontFamily: FONT_BEBAS_NEUE }]}>
            {showBoss ? `$${run.money}` : "—"}
          </Text>
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
  bossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 12,
  },
  bossHidden: {
    opacity: 0,
  },
  bossTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    backgroundColor: "rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  bossFill: {
    height: "100%",
    backgroundColor: Neo.neonYellow,
  },
  bossHp: {
    fontSize: 10,
    color: Neo.neonYellow,
    minWidth: 44,
    textAlign: "right",
  },
});
