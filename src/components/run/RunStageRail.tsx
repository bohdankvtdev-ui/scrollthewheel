import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { WHEEL_COUNT, WHEEL_ROTATION } from "../../game/loop";
import { getScalingParams } from "../../game/loop";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import { RUN_PAGE_BACKGROUND } from "../../game/runVisual";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";
import { WheelMapIcon } from "./WheelMapIcon";

const LASER_BTN = 36;

type RunStageRailProps = {
  run: RunState;
};

export function RunStageRail({ run }: RunStageRailProps) {
  const floorTier = getScalingParams(run.floor).blindLabel;
  const currentMeta = getWheelArchetypeMetaForIndex(run.wheelIndex);
  const currentTitle =
    run.wheels[run.wheelIndex]?.definition.title ??
    WHEEL_ROTATION[run.wheelIndex]?.title ??
    "Wheel";

  const wedgeLaserCount = run.inventory?.wedgeEraser ?? 0;
  const sliceEraseMode = useRunStore((s) => s.ui.sliceEraseMode);
  const setSliceEraseMode = useRunStore((s) => s.setSliceEraseMode);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const laserArmed = sliceEraseMode && wedgeLaserCount > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.floorCol}>
          <View style={styles.cycleRow}>
            <MaterialIcons name="autorenew" size={16} color={Neo.neonYellow} />
            <Text style={[styles.floorTier, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
              {floorTier}
            </Text>
          </View>
          <Text style={[styles.floorMeta, { fontFamily: FONT_BEBAS_NEUE }]}>
            Wheel {run.wheelIndex + 1}/{WHEEL_COUNT}
          </Text>
          {run.wheelIndex < WHEEL_COUNT - 1 ? (
            <Text style={[styles.nextPreview, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
              Next: {getWheelArchetypeMetaForIndex(run.wheelIndex + 1).tag} —{" "}
              {getWheelArchetypeMetaForIndex(run.wheelIndex + 1).hint}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.wheelBadge,
            { borderColor: currentMeta.accent, backgroundColor: RUN_PAGE_BACKGROUND },
          ]}
        >
          <WheelMapIcon meta={currentMeta} size={16} />
          <Text style={[styles.wheelTitle, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {currentTitle}
          </Text>
          <Text style={[styles.wheelHint, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {currentMeta.hint}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipRow}
          style={styles.pipScroll}
        >
          {WHEEL_ROTATION.map((def, i) => {
            const done = i < run.wheelIndex;
            const current = i === run.wheelIndex;
            const meta = getWheelArchetypeMetaForIndex(i);
            const iconColor = current || done ? Neo.ink : "rgba(250,250,250,0.5)";

            return (
              <View
                key={def.id}
                style={[
                  styles.pip,
                  done && styles.pipDone,
                  current && [styles.pipCurrent, { backgroundColor: meta.accent, borderColor: meta.accent }],
                ]}
                accessibilityLabel={`${meta.tag}${current ? " current" : done ? " done" : ""}`}
              >
                <WheelMapIcon meta={meta} size={current ? 15 : 13} color={iconColor} />
              </View>
            );
          })}
        </ScrollView>

        {wedgeLaserCount > 0 ? (
          <Pressable
            style={[
              styles.laserBtn,
              laserArmed && styles.laserBtnArmed,
              isSpinning && styles.laserBtnDisabled,
            ]}
            onPress={() => setSliceEraseMode(!sliceEraseMode)}
            disabled={isSpinning}
            accessibilityRole="button"
            accessibilityLabel={
              laserArmed
                ? "Wedge Laser armed — tap a wedge on the wheel"
                : `Wedge Laser, ${wedgeLaserCount} uses`
            }
            accessibilityState={{ selected: laserArmed }}
          >
            <MaterialCommunityIcons
              name="ray-start"
              size={20}
              color={laserArmed ? Neo.ink : Neo.textOnDark}
            />
            {wedgeLaserCount > 1 ? (
              <View style={styles.laserBadge}>
                <Text style={[styles.laserBadgeText, { fontFamily: FONT_BEBAS_NEUE }]}>
                  {wedgeLaserCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      {wedgeLaserCount > 0 ? (
        <Text style={[styles.laserHint, { fontFamily: FONT_BEBAS_NEUE }]}>
          {laserArmed ? "Tap a wedge to remove it" : "Wedge Laser"}
        </Text>
      ) : null}
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
    paddingBottom: 6,
    gap: 4,
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
  cycleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  nextPreview: {
    fontSize: 10,
    color: "rgba(34,211,238,0.75)",
    letterSpacing: 0.2,
  },
  wheelBadge: {
    maxWidth: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: Neo.borderBold,
  },
  wheelTitle: {
    flexShrink: 1,
    fontSize: 14,
    color: Neo.textOnDark,
    letterSpacing: 0.3,
  },
  wheelHint: {
    fontSize: 10,
    color: "rgba(250,250,250,0.5)",
    letterSpacing: 0.2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: LASER_BTN,
  },
  pipScroll: {
    flex: 1,
    minWidth: 0,
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
    opacity: 0.55,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pipCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    opacity: 1,
  },
  laserBtn: {
    width: LASER_BTN,
    height: LASER_BTN,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  laserBtnArmed: {
    backgroundColor: "#FDE047",
    borderColor: Neo.ink,
    borderWidth: Neo.borderBold,
  },
  laserBtnDisabled: {
    opacity: 0.45,
  },
  laserBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Neo.neonCyan,
    borderWidth: 1,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  laserBadgeText: {
    fontSize: 10,
    color: Neo.ink,
  },
  laserHint: {
    alignSelf: "flex-end",
    fontSize: 10,
    color: "rgba(250,250,250,0.5)",
    letterSpacing: 0.3,
    marginTop: -2,
    paddingRight: 2,
  },
});
