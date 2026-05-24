import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { WHEEL_COUNT, WHEEL_ROTATION } from "../../game/loop";
import {
  getWheelArchetypeMetaForIndex,
  wheelStageTagLabel,
} from "../../data/wheelArchetypeMeta";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";
import { WheelMapIcon } from "./WheelMapIcon";

type RunStageRailProps = {
  run: RunState;
};

/**
 * Fixed-size stage rail — tag-only wheel label (MONEY, FORGE, …) so layout
 * does not shift when switching wheels or on phone / tablet widths.
 */
export function RunStageRail({ run }: RunStageRailProps) {
  const chrome = useRunChromeMetrics();
  const stage = chrome.stage;
  const pip = stage.pipSize;
  const currentMeta = getWheelArchetypeMetaForIndex(run.wheelIndex);
  const stageTag = wheelStageTagLabel(currentMeta);
  const wedgeLaserCount = run.inventory?.wedgeEraser ?? 0;
  const sliceEraseMode = useRunStore((s) => s.ui.sliceEraseMode);
  const setSliceEraseMode = useRunStore((s) => s.setSliceEraseMode);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const laserArmed = sliceEraseMode && wedgeLaserCount > 0;

  const laserControl =
    wedgeLaserCount > 0 ? (
      <Pressable
        style={[
          styles.laserBtn,
          { width: stage.laserSize, height: stage.laserSize },
          laserArmed && styles.laserBtnArmed,
          isSpinning && styles.laserBtnDisabled,
        ]}
        onPress={() => setSliceEraseMode(!sliceEraseMode)}
        disabled={isSpinning}
        accessibilityRole="button"
        accessibilityLabel={
          laserArmed ? "Wedge Laser armed" : `Wedge Laser, ${wedgeLaserCount} uses`
        }
        accessibilityState={{ selected: laserArmed }}
      >
        <MaterialCommunityIcons
          name="ray-start"
          size={stage.laserIconSize}
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
    ) : null;

  const pipStrip = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.pipRow, { height: pip + 4 }]}
      style={[styles.pipScroll, { height: pip + 4 }]}
    >
      {WHEEL_ROTATION.map((def, i) => {
        const done = i < run.wheelIndex;
        const current = i === run.wheelIndex;
        const meta = getWheelArchetypeMetaForIndex(i);
        const iconColor = current
          ? Neo.ink
          : done
            ? "rgba(250,250,250,0.38)"
            : "rgba(250,250,250,0.52)";

        return (
          <View
            key={def.id}
            style={[styles.pipSlot, { width: pip, height: pip + 4 }]}
            accessibilityLabel={`${meta.mapLabel} ${meta.tag}${current ? ", current" : done ? ", done" : ""}`}
          >
            <View
              style={[
                styles.pipRing,
                { width: pip, height: pip, borderRadius: pip / 2 },
                current && { borderColor: meta.accent, borderWidth: 2 },
              ]}
            >
              <View
                style={[
                  styles.pip,
                  {
                    width: pip - 4,
                    height: pip - 4,
                    borderRadius: (pip - 4) / 2,
                  },
                  current && { backgroundColor: meta.accent },
                  done && !current && styles.pipDone,
                ]}
              >
                <WheelMapIcon meta={meta} size={stage.pipIcon} color={iconColor} />
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View
      style={[
        styles.wrap,
        {
          height: stage.height,
          paddingHorizontal: stage.padH,
        },
      ]}
    >
      <View style={[styles.row, { minHeight: pip + 4 }]}>
        <View
          style={[
            styles.metaBlock,
            {
              width: stage.metaWidth,
              borderLeftColor: currentMeta.accent,
            },
          ]}
          accessibilityLabel={`Cycle ${run.floor}, ${stageTag}`}
        >
          <View
            style={[
              styles.iconBox,
              {
                width: stage.mainIcon + 12,
                height: stage.mainIcon + 12,
                backgroundColor: `${currentMeta.accent}40`,
              },
            ]}
          >
            <WheelMapIcon meta={currentMeta} size={stage.mainIcon} color={Neo.ink} />
          </View>
          <View style={[styles.metaText, { width: stage.metaWidth - stage.mainIcon - 22 }]}>
            <Text
              style={[
                styles.cycleLine,
                {
                  fontFamily: FONT_BEBAS_NEUE,
                  fontSize: stage.cycleFontSize,
                  lineHeight: stage.cycleFontSize + 1,
                  height: stage.cycleFontSize + 1,
                },
              ]}
              numberOfLines={1}
            >
              Cycle {run.floor}
            </Text>
            <View
              style={[
                styles.tagSlot,
                { width: stage.tagWidth, height: stage.tagFontSize + 3 },
              ]}
            >
              <Text
                style={[
                  styles.tagLine,
                  {
                    fontFamily: FONT_BEBAS_NEUE,
                    fontSize: stage.tagFontSize,
                    lineHeight: stage.tagFontSize + 3,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {stageTag}
              </Text>
            </View>
            <Text
              style={[
                styles.progressLine,
                {
                  fontFamily: FONT_BEBAS_NEUE,
                  fontSize: stage.progressFontSize,
                  lineHeight: stage.progressFontSize + 1,
                  height: stage.progressFontSize + 1,
                },
              ]}
              numberOfLines={1}
            >
              {run.wheelIndex + 1}/{WHEEL_COUNT}
            </Text>
          </View>
        </View>

        {pipStrip}
        {laserControl}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Neo.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  metaBlock: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 4,
    paddingLeft: 4,
    borderLeftWidth: 2,
  },
  iconBox: {
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  metaText: {
    justifyContent: "center",
    flexShrink: 0,
  },
  cycleLine: {
    color: Neo.textOnDark,
    letterSpacing: 0.2,
  },
  tagSlot: {
    justifyContent: "center",
    marginTop: 1,
    marginBottom: 1,
  },
  tagLine: {
    color: Neo.textOnDark,
    letterSpacing: 0.6,
  },
  progressLine: {
    color: "rgba(250,250,250,0.45)",
    letterSpacing: 0.2,
  },
  pipScroll: {
    flex: 1,
    minWidth: 0,
    marginLeft: -4,
  },
  pipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 0,
    paddingRight: 2,
    flexGrow: 0,
  },
  pipSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  pipRing: {
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  pip: {
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.14)",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  pipDone: {
    opacity: 0.45,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  laserBtn: {
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  laserBtnArmed: {
    backgroundColor: "#FDE047",
    borderColor: Neo.ink,
    borderWidth: 1.5,
  },
  laserBtnDisabled: {
    opacity: 0.45,
  },
  laserBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Neo.neonCyan,
    borderWidth: 1,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  laserBadgeText: {
    fontSize: 8,
    color: Neo.ink,
  },
});
