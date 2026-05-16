import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { WHEEL_COUNT, WHEEL_ROTATION, WHEEL_STAGES } from "../../game/loop";
import { getScalingParams } from "../../game/loop";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { formatMoney } from "../../utils/formatMoney";

type RunStageRailProps = {
  run: RunState;
};

export function RunStageRail({ run }: RunStageRailProps) {
  const floorTier = getScalingParams(run.floor).blindLabel;
  const currentWheel = run.wheels[run.wheelIndex];
  const currentTitle = currentWheel?.definition.title ?? WHEEL_ROTATION[run.wheelIndex]?.title ?? "Wheel";
  const stage = WHEEL_STAGES[WHEEL_ROTATION[run.wheelIndex]?.role ?? "base"];
  const quotaPct = Math.min(1, run.money / Math.max(1, run.blindQuota));
  const quotaOk = run.money >= run.blindQuota;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.floorCol}>
          <Text style={[styles.floorTier, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {floorTier}
          </Text>
          <Text style={[styles.floorMeta, { fontFamily: FONT_BEBAS_NEUE }]}>
            Blind · Wheel {run.wheelIndex + 1}/{WHEEL_COUNT}
          </Text>
        </View>
        <View style={[styles.wheelBadge, { borderColor: stage.accent }]}>
          <Text style={[styles.wheelTitle, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {currentTitle}
          </Text>
        </View>
      </View>

      <View style={styles.quotaRow}>
        <Text style={[styles.quotaLabel, { fontFamily: FONT_BEBAS_NEUE }]}>Bank</Text>
        <Text style={[styles.quotaNum, { fontFamily: FONT_BEBAS_NEUE, color: quotaOk ? Neo.neonCyan : Neo.textOnDark }]}>
          {formatMoney(run.money)}
        </Text>
        <View style={styles.quotaTrack}>
          <View
            style={[
              styles.quotaFill,
              {
                width: `${Math.max(4, Math.round(quotaPct * 100))}%`,
                backgroundColor: quotaOk ? Neo.neonCyan : Neo.neonYellow,
              },
            ]}
          />
        </View>
        <Text style={[styles.quotaTarget, { fontFamily: FONT_BEBAS_NEUE }]}>
          Blind {formatMoney(run.blindQuota)}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pipRow}
      >
        {WHEEL_ROTATION.map((def, i) => {
          const done = i < run.wheelIndex;
          const current = i === run.wheelIndex;
          const meta = WHEEL_STAGES[def.role];
          const Icon =
            meta.iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : MaterialIcons;

          return (
            <View
              key={def.id}
              style={[
                styles.pip,
                done && styles.pipDone,
                current && [styles.pipCurrent, { backgroundColor: meta.accent, borderColor: meta.accent }],
              ]}
              accessibilityLabel={`${def.title}${current ? " current" : done ? " done" : ""}`}
            >
              {current || done ? (
                <Icon name={meta.icon as never} size={14} color={Neo.ink} />
              ) : (
                <View style={styles.pipDot} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: RUN_LAYOUT.stageRail,
    backgroundColor: Neo.surfaceDark,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  floorCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  floorTier: {
    fontSize: 17,
    color: Neo.neonYellow,
    letterSpacing: 0.4,
  },
  floorMeta: {
    fontSize: 12,
    color: "rgba(250,250,250,0.55)",
    letterSpacing: 0.25,
  },
  wheelBadge: {
    maxWidth: "46%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: Neo.borderBold,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  wheelTitle: {
    fontSize: 14,
    color: Neo.textOnDark,
    letterSpacing: 0.3,
  },
  quotaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quotaLabel: {
    fontSize: 11,
    color: "rgba(250,250,250,0.45)",
    width: 32,
  },
  quotaNum: {
    fontSize: 13,
    minWidth: 44,
    textAlign: "right",
  },
  quotaTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 4,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.15)",
    overflow: "hidden",
  },
  quotaFill: {
    height: "100%",
    borderRadius: 3,
  },
  quotaTarget: {
    fontSize: 13,
    color: "rgba(250,250,250,0.55)",
    minWidth: 44,
  },
  pipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
  },
  pip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.2)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  pipDone: {
    opacity: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pipCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    opacity: 1,
  },
  pipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(250,250,250,0.35)",
  },
});
