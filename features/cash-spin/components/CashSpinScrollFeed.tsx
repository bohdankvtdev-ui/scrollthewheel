import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { formatWinnerLabel } from "../../../lib/spin/formatWinner";
import type { WheelPhysicsConfig } from "../../../lib/wheel";
import { Neo, neoCardStyle, neoSubtitleOnDark } from "../../../theme/neoBrutal";
import type { SpinWheelItem } from "../../../types/spin";
import { useReelStripEngine } from "../hooks/useReelStripEngine";
import { REEL_STRIP } from "../reelStripConstants";
import { isCompactCashSpinWindow, stripVisualIntensityForDevice } from "../cashStripPerformance";
import { CASH_SPIN_PAGE_THEMES, pickNextBackgroundIndex, type CashSpinPageTheme } from "../pageThemes";
import type { ScrollWheelRound } from "../hooks/useScrollTheWheelRounds";
import { SpinWheelStage } from "./SpinWheelStage";

type CashSpinScrollFeedProps = {
  itemHeight: number;
  wheelData: SpinWheelItem[];
  wheelInnerSize: number;
  textSize: number;
  wheelPhysics: WheelPhysicsConfig;
  segmentColors: readonly string[];
  textColor: string;
  rounds: ScrollWheelRound[];
  onSpinWon: (roundIndex: number, item: SpinWheelItem) => void;
  onClaimed: (roundIndex: number) => void;
  onLatestPrize: (label: string) => void;
  growToMinLength?: (minLength: number) => void;
  /** Safe area + header stay in sync with reel theme (layout effect, same commit as advance). */
  onPageThemeChange?: (theme: CashSpinPageTheme) => void;
  /** Optional hook after theme index advances (e.g. analytics). */
  onReelAdvanced?: () => void;
};

function ScrollUpCue({ active, staticPresentation }: { active: boolean; staticPresentation?: boolean }) {
  const t = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (staticPresentation) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    if (active) {
      t.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 560, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 560, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(t);
      t.value = withTiming(0, { duration: 220 });
    }
  }, [active, staticPresentation, t]);

  const aStyle = useAnimatedStyle(
    () => ({
      opacity: staticPresentation ? 0.55 : 0.32 + t.value * 0.68,
      transform: staticPresentation ? [] : [{ translateY: t.value * 10 }],
    }),
    [staticPresentation]
  );

  if (!active) return null;

  const bottomPad = Math.max(insets.bottom, 12) + 10;

  return (
    <Animated.View pointerEvents="none" style={[styles.cueWrap, { paddingBottom: bottomPad }, aStyle]}>
      <View style={styles.cuePill} accessibilityRole="text" accessibilityLabel="Swipe down for next reel">
        <MaterialIcons name="arrow-downward" size={22} color={Neo.ink} />
        <Text style={styles.cueText}>Next</Text>
      </View>
    </Animated.View>
  );
}

function ClaimedRoundShell({
  pageHeight,
  roundIndex,
  prizeLabel,
}: {
  pageHeight: number;
  roundIndex: number;
  prizeLabel: string | null;
}) {
  return (
    <View style={[styles.page, { height: pageHeight }]}>
      <View
        style={[
          neoCardStyle(400),
          {
            alignSelf: "center",
            width: "100%",
            borderLeftWidth: 8,
            borderLeftColor: Neo.accent,
          },
        ]}
      >
        <Text style={neoSubtitleOnDark(11)}>Round {roundIndex + 1}</Text>
        {prizeLabel != null && prizeLabel.trim().length > 0 ? (
          <Text style={styles.prizeRecap} numberOfLines={2}>
            {prizeLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function CashSpinScrollFeed({
  itemHeight,
  wheelData,
  wheelInnerSize,
  textSize,
  wheelPhysics,
  segmentColors,
  textColor,
  rounds,
  onSpinWon,
  onClaimed,
  onLatestPrize,
  growToMinLength,
  onPageThemeChange,
  onReelAdvanced: onReelAdvancedProp,
}: CashSpinScrollFeedProps) {
  const pageHeight = Math.max(1, Math.round(itemHeight));

  const [pageThemeIndex, setPageThemeIndex] = useState(0);
  const pageTheme = useMemo(
    () => CASH_SPIN_PAGE_THEMES[pageThemeIndex] ?? CASH_SPIN_PAGE_THEMES[0],
    [pageThemeIndex]
  );

  const { width: winW, height: winH } = useWindowDimensions();
  const reduceMotionBoot = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(reduceMotionBoot);

  useEffect(() => {
    let alive = true;
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const compactWindow = useMemo(() => isCompactCashSpinWindow(winW, winH), [winW, winH]);
  const stripVisualIntensity = useMemo(
    () => stripVisualIntensityForDevice(reduceMotion, compactWindow),
    [compactWindow, reduceMotion]
  );
  const scrollCueLite = stripVisualIntensity < 0.25;

  const onPageThemeChangeRef = useRef(onPageThemeChange);
  onPageThemeChangeRef.current = onPageThemeChange;

  useLayoutEffect(() => {
    onPageThemeChangeRef.current?.(pageTheme);
  }, [pageTheme]);

  const onSpinWonRef = useRef(onSpinWon);
  const onLatestPrizeRef = useRef(onLatestPrize);
  onSpinWonRef.current = onSpinWon;
  onLatestPrizeRef.current = onLatestPrize;

  const onReelAdvancedPropRef = useRef(onReelAdvancedProp);
  onReelAdvancedPropRef.current = onReelAdvancedProp;

  const advancePageTheme = useCallback(() => {
    setPageThemeIndex((prev) => pickNextBackgroundIndex(prev, CASH_SPIN_PAGE_THEMES.length));
    onReelAdvancedPropRef.current?.();
  }, []);

  const reel = useReelStripEngine({
    pageHeight,
    rounds,
    onClaimed,
    growToMinLength,
    onReelAdvanced: advancePageTheme,
    stripVisualIntensity,
  });

  /**
   * Two stable strip buffers (a = current, b = next). Same `SpinWheelStage` instances are reused
   * across advances so the hub/SVG are not torn down — major scroll smoothness win vs keyed remounts.
   */
  const renderStripBuffer = useCallback(
    (buffer: "a" | "b") => {
      const roundIndex = buffer === "a" ? reel.activeIndex : reel.nextIndex;
      if (buffer === "b" && roundIndex == null) {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }

      const ri = roundIndex as number;
      const round = rounds[ri];
      const prizeLabel = round?.prize != null ? formatWinnerLabel(round.prize) : null;

      if (round?.status === "claimed") {
        return (
          <View style={[styles.slotRow, styles.slotRowCentered, { height: pageHeight }]}>
            <ClaimedRoundShell pageHeight={pageHeight} roundIndex={ri} prizeLabel={prizeLabel} />
          </View>
        );
      }

      if (round?.status === "locked") {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }

      const spinLocked = round == null ? true : round.status !== "ready";
      const listenBulb = buffer === "a";

      return (
        <View style={[styles.slotRow, styles.slotRowCentered, { height: pageHeight }]}>
          <View style={styles.wheelSlotShell}>
            <View style={styles.wheelPad}>
              <SpinWheelStage
                data={wheelData}
                wheelInnerSize={wheelInnerSize}
                textSize={textSize}
                wheelPhysics={wheelPhysics}
                segmentColors={segmentColors}
                textColor={textColor}
                ringPhaseResetKey={ri}
                spinLocked={spinLocked}
                onBulbRingPhaseChange={listenBulb ? reel.onPrimaryBulbPhaseChange : undefined}
                onSpinComplete={(wonItem) => {
                  if (round?.status !== "ready") return;
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onSpinWonRef.current(ri, wonItem);
                  onLatestPrizeRef.current(formatWinnerLabel(wonItem));
                }}
              />
            </View>
          </View>
          <ScrollUpCue
            active={round?.status === "won" && listenBulb}
            staticPresentation={scrollCueLite}
          />
        </View>
      );
    },
    [
      pageHeight,
      reel.activeIndex,
      reel.nextIndex,
      reel.onPrimaryBulbPhaseChange,
      rounds,
      scrollCueLite,
      segmentColors,
      textColor,
      textSize,
      wheelData,
      wheelInnerSize,
      wheelPhysics,
    ]
  );

  return (
    <View
      style={[styles.root, { backgroundColor: pageTheme.pageBg }]}
      accessibilityLabel="Wheel reels"
    >
      <View style={styles.flexFill} pointerEvents={reel.interactionLocked ? "none" : "auto"}>
        <View style={[styles.clip, { height: pageHeight }]}>
          <GestureDetector gesture={reel.panGesture}>
            <Animated.View
              collapsable={false}
              needsOffscreenAlphaCompositing={stripVisualIntensity > 0}
              renderToHardwareTextureAndroid={
                Platform.OS === "android" && REEL_STRIP.performance.androidStripHardwareTexture
              }
              style={[{ width: "100%", height: pageHeight * 2 }, reel.stripStyle]}
            >
              <View
                key="strip-buffer-a"
                style={[styles.slotRow, { height: pageHeight, backgroundColor: pageTheme.pageBg }]}
                collapsable={false}
              >
                {renderStripBuffer("a")}
              </View>
              <View
                key="strip-buffer-b"
                style={[styles.slotRow, { height: pageHeight, backgroundColor: pageTheme.pageBg }]}
                collapsable={false}
              >
                {renderStripBuffer("b")}
              </View>
            </Animated.View>
          </GestureDetector>

          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: pageTheme.scrimBase },
              reel.motionScrimStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  clip: {
    overflow: "hidden",
    width: "100%",
    position: "relative",
  },
  /** One reel page row — full width; pair with `height: pageHeight` from caller. */
  slotRow: {
    width: "100%",
  },
  slotRowCentered: {
    justifyContent: "center",
    alignItems: "center",
  },
  wheelSlotShell: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },
  wheelPad: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  page: {
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cueWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: Neo.neonYellow,
    shadowColor: Neo.accentInk,
    shadowOffset: Neo.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  cueText: {
    fontWeight: "900",
    color: Neo.ink,
    fontSize: 14,
    letterSpacing: 0.35,
    marginLeft: 2,
  },
  prizeRecap: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "900",
    color: Neo.neonYellow,
  },
});
