import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunUiEffect } from "../../stores/runStore";
import type { RunState, SliceKind } from "../../schemas";
import { TacticPickBar } from "./TacticPickBar";

const ICON_SLOT = 42;

type RunPrizeFlashProps = {
  effect: RunUiEffect | null;
  awaitingClaim: boolean;
  isSpinning: boolean;
  lastRewardKind?: SliceKind | string | null;
  tacticPick?: boolean;
  run?: RunState | null;
  onDismissTactic?: () => void;
  /** Wheel 9 — swipe up ends the cycle (no reel wrap). */
  bossEndCycleHint?: boolean;
};

export function RunPrizeFlash({
  effect,
  awaitingClaim,
  isSpinning,
  lastRewardKind,
  tacticPick = false,
  run = null,
  onDismissTactic,
  bossEndCycleHint = false,
}: RunPrizeFlashProps) {
  if (tacticPick && run != null && onDismissTactic != null) {
    return (
      <View style={[styles.wrap, styles.wrapTactic]}>
        <TacticPickBar run={run} onDismiss={onDismissTactic} />
      </View>
    );
  }

  const isPerkWin = lastRewardKind === "perk" && effect != null;
  const showResult = awaitingClaim && effect != null && !isSpinning;

  let line = "Tap to spin";
  let sub = " ";
  let accent = "rgba(255,255,255,0.06)";

  if (isSpinning) {
    line = "Spinning…";
    sub = " ";
    accent = "rgba(34,211,238,0.1)";
  } else if (showResult) {
    line = effect.shortLabel;
    sub = bossEndCycleHint
      ? "Swipe up — cycle rewards"
      : isPerkWin
        ? "New perk — swipe up"
        : "Swipe up for next wheel";
    accent = isPerkWin ? "#EDE9FE" : effect.accent;
  } else if (effect != null) {
    line = effect.shortLabel;
    sub = effect.effectHint;
    accent = effect.accent;
  }

  const accentOpacity = useSharedValue(0);
  useEffect(() => {
    accentOpacity.value = withTiming(showResult ? 1 : 0, { duration: 220 });
  }, [accentOpacity, showResult]);

  const accentLayerStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
  }));

  const textColor = showResult ? Neo.ink : Neo.textOnDark;
  const subColor = showResult ? "rgba(15,15,20,0.72)" : "rgba(250,250,250,0.45)";

  const contentKey = showResult ? `result-${effect.shortLabel}` : isSpinning ? "spin" : "idle";

  return (
    <View style={[styles.wrap, styles.wrapIdle]}>
      <View style={[StyleSheet.absoluteFillObject, styles.baseLayer]} />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: accent }, accentLayerStyle]}
      />
      {isPerkWin && showResult ? (
        <View pointerEvents="none" style={styles.perkShine} />
      ) : null}

      <View style={styles.iconSlot}>
        {showResult && effect != null ? (
          <Animated.View key={contentKey} entering={FadeInUp.springify().damping(16).duration(280)}>
            <PrizeGlyph
              icon={effect.icon}
              iconFamily={effect.iconFamily}
              size="md"
              tint={isPerkWin ? "#FEF08A" : effect.accent}
              iconColor={effect.iconColor}
              tone={isPerkWin ? "perk" : effect.tone}
              variant={isPerkWin ? "jackpot" : "default"}
            />
          </Animated.View>
        ) : (
          <MaterialIcons name="casino" size={26} color="rgba(250,250,250,0.4)" />
        )}
      </View>

      <View style={styles.textCol}>
        <Animated.View key={`line-${contentKey}`} entering={FadeIn.duration(180)}>
          <Text style={[styles.line, { fontFamily: FONT_BEBAS_NEUE, color: textColor }]} numberOfLines={1}>
            {line}
          </Text>
        </Animated.View>
        <Text style={[styles.sub, { color: subColor }]} numberOfLines={1}>
          {sub}
        </Text>
      </View>

      {isPerkWin && showResult ? (
        <View style={styles.perkBadge}>
          <Text style={[styles.perkBadgeText, { fontFamily: FONT_BEBAS_NEUE }]}>PERK</Text>
        </View>
      ) : (
        <View style={styles.perkBadgeSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: Neo.borderBold,
    borderTopColor: Neo.ink,
    overflow: "hidden",
    alignItems: "center",
  },
  wrapIdle: {
    height: RUN_LAYOUT.prizeFlash,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    width: "100%",
  },
  wrapTactic: {
    height: RUN_LAYOUT.prizeFlash,
    backgroundColor: "#FFFBEB",
    width: "100%",
    justifyContent: "center",
  },
  baseLayer: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  perkShine: {
    position: "absolute",
    top: -20,
    right: 24,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,233,77,0.12)",
  },
  iconSlot: {
    width: ICON_SLOT,
    height: ICON_SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  line: {
    fontSize: 22,
    letterSpacing: 0.4,
  },
  sub: {
    fontSize: 12,
    lineHeight: 15,
  },
  perkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  perkBadgeSpacer: {
    width: 44,
  },
  perkBadgeText: {
    fontSize: 11,
    color: Neo.ink,
    letterSpacing: 0.6,
  },
});
