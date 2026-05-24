import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunUiEffect } from "../../stores/runStore";
import type { RunState, SliceKind } from "../../schemas";
import type { SpinFeedbackTier } from "../../game/spinFeedback";
import {
  feedbackVisual,
  isLossTier,
  washFlashIntensity,
} from "../../game/spinFeedback";
import { TacticPickBar } from "./TacticPickBar";

const SPIN_DOTS_MS = 480;

function SpinningLabel({
  color,
  fontFamily,
  fontSize,
}: {
  color: string;
  fontFamily: string;
  fontSize: number;
}) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((n) => (n >= 3 ? 1 : n + 1));
    }, SPIN_DOTS_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text style={[styles.line, { fontFamily, color, fontSize }]} numberOfLines={1}>
      Spinning{".".repeat(dotCount)}
    </Text>
  );
}

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
  spinFeedbackTier?: SpinFeedbackTier | null;
};

/** Tactic picker — separate component so prize bar hooks are never skipped. */
function TacticPickFlash({
  run,
  onDismissTactic,
}: {
  run: RunState;
  onDismissTactic: () => void;
}) {
  const chrome = useRunChromeMetrics();
  return (
    <View style={[styles.wrap, styles.wrapTactic, { height: chrome.layout.prizeFlash }]}>
      <TacticPickBar run={run} onDismiss={onDismissTactic} />
    </View>
  );
}

function PrizeResultBar({
  effect,
  awaitingClaim,
  isSpinning,
  lastRewardKind,
  bossEndCycleHint,
  spinFeedbackTier,
}: {
  effect: RunUiEffect | null;
  awaitingClaim: boolean;
  isSpinning: boolean;
  lastRewardKind?: SliceKind | string | null;
  bossEndCycleHint: boolean;
  spinFeedbackTier: SpinFeedbackTier | null;
}) {
  const chrome = useRunChromeMetrics();
  const pf = chrome.prizeFlash;
  const barHeight = chrome.layout.prizeFlash;
  const iconSlot = chrome.layout.prizeIconSlot;
  const isPerkWin = lastRewardKind === "perk" && effect != null;
  const showResult = awaitingClaim && effect != null && !isSpinning;
  const showTapToSpin = !isSpinning && !showResult && effect == null;

  let line = "Tap to spin";
  let sub = " ";
  let accent = "rgba(255,255,255,0.06)";

  if (isSpinning) {
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
  const pulse = useSharedValue(1);
  const isLossResult = showResult && spinFeedbackTier != null && isLossTier(spinFeedbackTier);
  const flashIntensity =
    showResult && spinFeedbackTier != null && spinFeedbackTier !== "neutral"
      ? washFlashIntensity(spinFeedbackTier)
      : null;

  useEffect(() => {
    const target =
      showResult && flashIntensity != null ? flashIntensity.peak * 0.85 : showResult ? 0.5 : 0;
    accentOpacity.value = withTiming(target, { duration: 220 });
  }, [accentOpacity, showResult, flashIntensity]);

  useEffect(() => {
    if (!showResult || spinFeedbackTier == null || spinFeedbackTier === "neutral") {
      pulse.value = withTiming(1, { duration: 120 });
      return;
    }
    const pop = 1 + (flashIntensity?.peak ?? 0.3) * 0.06;
    pulse.value = withSequence(
      withTiming(pop, { duration: 120 }),
      withTiming(1, { duration: 200 })
    );
  }, [showResult, spinFeedbackTier, flashIntensity, pulse]);

  const accentLayerStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
  }));

  const barPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const resultVisual =
    showResult && spinFeedbackTier != null ? feedbackVisual(spinFeedbackTier) : null;
  const textColor = showResult
    ? isLossResult
      ? "#FF4A5E"
      : Neo.ink
    : Neo.textOnDark;
  const subColor = showResult ? "rgba(15,15,20,0.72)" : "rgba(250,250,250,0.45)";
  const flashBg = resultVisual?.wash ?? (showResult ? accent : "rgba(255,255,255,0.06)");

  const contentKey = showResult ? `result-${effect.shortLabel}` : isSpinning ? "spin" : "idle";

  return (
    <Animated.View
      style={[styles.wrap, styles.wrapIdle, barPopStyle, { height: barHeight, paddingHorizontal: chrome.bar.padH }]}
    >
      <View style={[StyleSheet.absoluteFillObject, styles.baseLayer]} />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: flashBg }, accentLayerStyle]}
      />
      {isPerkWin && showResult ? (
        <View pointerEvents="none" style={styles.perkShine} />
      ) : null}

      <View style={[styles.iconSlot, { width: iconSlot, height: iconSlot }]}>
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
          <MaterialIcons name="casino" size={pf.idleIconSize} color="rgba(250,250,250,0.4)" />
        )}
      </View>

      <View style={styles.textCol}>
        {showTapToSpin ? (
          <Text
            style={[styles.line, { fontFamily: FONT_BEBAS_NEUE, color: textColor, fontSize: pf.lineFontSize }]}
            numberOfLines={1}
          >
            Tap to spin
          </Text>
        ) : isSpinning ? (
          <SpinningLabel color={textColor} fontFamily={FONT_BEBAS_NEUE} fontSize={pf.lineFontSize} />
        ) : (
          <Animated.View key={`line-${contentKey}`} entering={FadeIn.duration(180)}>
            <Text
              style={[styles.line, { fontFamily: FONT_BEBAS_NEUE, color: textColor, fontSize: pf.lineFontSize }]}
              numberOfLines={1}
            >
              {line}
            </Text>
          </Animated.View>
        )}
        <Text style={[styles.sub, { color: subColor, fontSize: pf.subFontSize, lineHeight: pf.subFontSize + 3 }]} numberOfLines={1}>
          {sub}
        </Text>
      </View>

      {isPerkWin && showResult ? (
        <View style={styles.perkBadge}>
          <Text style={[styles.perkBadgeText, { fontFamily: FONT_BEBAS_NEUE, fontSize: pf.badgeFontSize }]}>
            PERK
          </Text>
        </View>
      ) : (
        <View style={[styles.perkBadgeSpacer, { width: iconSlot + 2 }]} />
      )}
    </Animated.View>
  );
}

export function RunPrizeFlash({
  effect,
  awaitingClaim,
  isSpinning,
  lastRewardKind,
  tacticPick = false,
  run = null,
  onDismissTactic,
  bossEndCycleHint = false,
  spinFeedbackTier = null,
}: RunPrizeFlashProps) {
  if (tacticPick && run != null && onDismissTactic != null) {
    return <TacticPickFlash run={run} onDismissTactic={onDismissTactic} />;
  }

  return (
    <PrizeResultBar
      effect={effect}
      awaitingClaim={awaitingClaim}
      isSpinning={isSpinning}
      lastRewardKind={lastRewardKind}
      bossEndCycleHint={bossEndCycleHint}
      spinFeedbackTier={spinFeedbackTier}
    />
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
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  wrapTactic: {
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
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  line: {
    letterSpacing: 0.4,
  },
  sub: {},
  perkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  perkBadgeSpacer: {},
  perkBadgeText: {
    color: Neo.ink,
    letterSpacing: 0.6,
  },
});
