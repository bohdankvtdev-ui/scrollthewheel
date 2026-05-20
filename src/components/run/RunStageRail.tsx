import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { WHEEL_COUNT, WHEEL_ROTATION } from "../../game/loop";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";
import { WheelMapIcon } from "./WheelMapIcon";

type RunStageRailProps = {
  run: RunState;
};

/** Current wheel + cycle progress — responsive, light borders. */
export function RunStageRail({ run }: RunStageRailProps) {
  const chrome = useRunChromeMetrics();
  const currentMeta = getWheelArchetypeMetaForIndex(run.wheelIndex);
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
          {
            width: chrome.stage.laserSize,
            height: chrome.stage.laserSize,
          },
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
          size={17}
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
      contentContainerStyle={styles.pipRow}
      style={chrome.compact ? styles.pipScrollFull : styles.pipScroll}
    >
      {WHEEL_ROTATION.map((def, i) => {
        const done = i < run.wheelIndex;
        const current = i === run.wheelIndex;
        const meta = getWheelArchetypeMetaForIndex(i);
        const iconColor = current || done ? Neo.ink : "rgba(250,250,250,0.5)";
        const size = current ? chrome.stage.pipCurrent : chrome.stage.pipSize;

        return (
          <View
            key={def.id}
            style={[
              styles.pip,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
              done && styles.pipDone,
              current && {
                backgroundColor: meta.accent,
                borderColor: meta.accent,
                borderWidth: chrome.accentStroke,
              },
            ]}
            accessibilityLabel={`${meta.tag}${current ? " current" : done ? " done" : ""}`}
          >
            <WheelMapIcon meta={meta} size={current ? 13 : 11} color={iconColor} />
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
          minHeight: chrome.stage.minHeight,
          paddingHorizontal: chrome.stage.padH,
          paddingVertical: chrome.stage.padV,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.wheelChip,
            {
              maxWidth: chrome.stage.wheelMaxWidth,
              borderLeftColor: currentMeta.accent,
              borderLeftWidth: chrome.accentStroke,
            },
          ]}
          accessibilityLabel={`${currentMeta.tag} — ${currentMeta.vibe}`}
        >
          <View
            style={[
              styles.iconDot,
              {
                width: chrome.stage.iconBox,
                height: chrome.stage.iconBox,
                borderRadius: chrome.stage.iconBox / 3,
                backgroundColor: `${currentMeta.accent}40`,
              },
            ]}
          >
            <WheelMapIcon meta={currentMeta} size={chrome.stage.iconSize} color={Neo.ink} />
          </View>
          <View style={styles.wheelCopy}>
            <Text
              style={[
                styles.wheelTitle,
                { fontFamily: FONT_BEBAS_NEUE, fontSize: chrome.stage.titleSize },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {currentMeta.tag} · W{run.wheelIndex + 1}/{WHEEL_COUNT}
            </Text>
            {!chrome.narrow ? (
              <Text
                style={[
                  styles.wheelSub,
                  { fontFamily: FONT_BEBAS_NEUE, fontSize: chrome.stage.subSize },
                ]}
                numberOfLines={1}
              >
                {chrome.compact ? currentMeta.hint : currentMeta.vibe}
              </Text>
            ) : (
              <Text
                style={[
                  styles.wheelSub,
                  { fontFamily: FONT_BEBAS_NEUE, fontSize: chrome.stage.subSize },
                ]}
                numberOfLines={1}
              >
                {currentMeta.hint}
              </Text>
            )}
          </View>
        </View>

        {!chrome.compact ? (
          <>
            {pipStrip}
            {laserControl}
          </>
        ) : null}
      </View>

      {chrome.compact ? (
        <View style={styles.bottomRow}>
          {pipStrip}
          {laserControl}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Neo.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 30,
  },
  wheelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 8,
  },
  iconDot: {
    alignItems: "center",
    justifyContent: "center",
  },
  wheelCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  wheelTitle: {
    color: Neo.textOnDark,
    letterSpacing: 0.2,
  },
  wheelSub: {
    color: "rgba(250,250,250,0.52)",
    letterSpacing: 0.12,
  },
  pipScroll: {
    flex: 1,
    minWidth: 0,
  },
  pipScrollFull: {
    flex: 1,
    minWidth: 0,
  },
  pipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 2,
  },
  pip: {
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.18)",
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  pipDone: {
    opacity: 0.5,
  },
  laserBtn: {
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.2)",
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
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Neo.neonCyan,
    borderWidth: 1,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  laserBadgeText: {
    fontSize: 9,
    color: Neo.ink,
  },
});
