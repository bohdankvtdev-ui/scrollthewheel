import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BlurView } from "expo-blur";
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
import { normalizeWheelInnerSize } from "../../../lib/layout/wheelFrame";
import { formatWinnerLabel } from "../../../lib/spin/formatWinner";
import type { WheelPhysicsConfig } from "../../../lib/wheel";
import { Neo, neoCardStyle, neoSubtitleStyle } from "../../../theme/neoBrutal";
import type { SpinWheelItem } from "../../../types/spin";
import { useReelStripEngine } from "../hooks/useReelStripEngine";
import { REEL_STRIP } from "../reelStripConstants";
import { isCompactCashSpinWindow, stripVisualIntensityForDevice, WHEEL_FROST_INTENSITY_REDUCE_MOTION } from "../cashStripPerformance";
import { CASH_SPIN_PAGE_THEMES, pickNextBackgroundIndex, type CashSpinPageTheme } from "../pageThemes";
import type { ScrollWheelRound } from "../hooks/useScrollTheWheelRounds";
import { SpinWheelStage } from "./SpinWheelStage";
import { WheelScrollFilmGrain } from "./WheelScrollFilmGrain";

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
  /** Active reel index + total rounds — for header progress (gamification shell). */
  onReelContext?: (ctx: { activeReelIndex: number; roundCount: number }) => void;
};

type ReelCuePhase = "off" | "spin" | "next";

function ReelActionCue({
  phase,
  staticPresentation,
  accentStripe,
  blurIntensity,
}: {
  phase: ReelCuePhase;
  staticPresentation?: boolean;
  accentStripe: string;
  /** 0–1 — scales blur cost on reduce-motion / low-end windows. */
  blurIntensity: number;
}) {
  const t = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (staticPresentation) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    if (phase === "off") {
      cancelAnimation(t);
      t.value = withTiming(0, { duration: 220 });
      return;
    }
    const isNext = phase === "next";
    const half = isNext ? 560 : 720;
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: half, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      false
    );
  }, [phase, staticPresentation, t]);

  const aStyle = useAnimatedStyle(() => {
    if (phase === "off") return { opacity: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    if (staticPresentation) {
      return {
        opacity: 0.55,
        transform: phase === "next" ? [{ translateY: 0 }, { scale: 1 }] : [{ translateY: 0 }, { scale: 1 }],
      };
    }
    if (phase === "spin") {
      return {
        opacity: 0.42 + t.value * 0.58,
        transform: [{ translateY: 0 }, { scale: 1 + t.value * 0.045 }],
      };
    }
    return {
      opacity: 0.3 + t.value * 0.7,
      transform: [{ translateY: t.value * 10 }, { scale: 1 }],
    };
  }, [phase, staticPresentation, t]);

  if (phase === "off") return null;

  const bottomPad = Math.max(insets.bottom, 12) + 10;
  const isSpin = phase === "spin";
  const a11y = isSpin ? "Tap the center of the wheel to spin" : "Swipe up for the next reel";

  const blurOn = Platform.OS !== "web" && blurIntensity > 0.12;
  const blurStrength = Math.round((isSpin ? 36 : 44) + blurIntensity * 28);

  return (
    <Animated.View pointerEvents="none" style={[styles.cueWrap, { paddingBottom: bottomPad }, aStyle]}>
      <View style={styles.cueCast} accessibilityRole="text" accessibilityLabel={a11y}>
        <View style={styles.cueShell}>
          {blurOn ? (
            <BlurView
              intensity={blurStrength}
              tint={isSpin ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
              {...(Platform.OS === "android"
                ? { experimentalBlurMethod: "dimezisBlurView" as const }
                : {})}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: isSpin ? Neo.accent : Neo.neonYellow, opacity: staticPresentation ? 0.55 : 0.92 },
              ]}
            />
          )}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: isSpin ? Neo.accent : Neo.neonYellow,
                opacity: staticPresentation ? 0.38 : isSpin ? 0.5 : 0.44,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: accentStripe, opacity: 0.16 }]}
          />
          <View style={styles.cueFg}>
            <MaterialIcons
              name={isSpin ? "casino" : "keyboard-double-arrow-up"}
              size={22}
              color={isSpin ? Neo.textOnDark : Neo.ink}
            />
            <Text style={[styles.cueText, isSpin ? styles.cueTextOnAccent : null]}>
              {isSpin ? "Spin" : "Next reel"}
            </Text>
          </View>
        </View>
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
        <View style={styles.claimedRoundHead}>
          <MaterialIcons name="emoji-events" size={18} color={Neo.neonYellow} />
          <Text style={[neoSubtitleStyle(11), styles.claimedRoundTitle]} numberOfLines={1}>
            Round {roundIndex + 1}
          </Text>
          <MaterialIcons name="verified" size={18} color={Neo.neonCyan} />
        </View>
        {prizeLabel != null && prizeLabel.trim().length > 0 ? (
          <View style={styles.prizeRecapRow}>
            <MaterialIcons name="layers" size={22} color={Neo.neonYellow} />
            <Text style={styles.prizeRecap} numberOfLines={2}>
              {prizeLabel}
            </Text>
          </View>
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
  onReelContext,
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
  const wheelFrostVisualIntensity = useMemo(
    () => (reduceMotion ? WHEEL_FROST_INTENSITY_REDUCE_MOTION : stripVisualIntensity),
    [reduceMotion, stripVisualIntensity]
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

  const onReelContextRef = useRef(onReelContext);
  onReelContextRef.current = onReelContext;

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
    wheelFrostVisualIntensity,
  });



  useLayoutEffect(() => {
    onReelContextRef.current?.({
      activeReelIndex: reel.activeIndex,
      roundCount: reel.roundCount,
    });
  }, [reel.activeIndex, reel.roundCount]);

  const activeRound = rounds[reel.activeIndex];
  const activeCuePhase: ReelCuePhase = useMemo(() => {
    if (activeRound?.status === "won") return "next";
    if (activeRound?.status === "ready") return "spin";
    return "off";
  }, [activeRound?.status]);

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

      const grainPrimary = buffer === "a" && wheelFrostVisualIntensity > 0;

      const discGrainSize = normalizeWheelInnerSize(wheelInnerSize);

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
                scrollGrainOverlay={
                  grainPrimary ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFillObject,
                        styles.wheelScrollGrainLayer,
                        reel.primaryWheelScrollFrostStyle,
                      ]}
                    >
                      <WheelScrollFilmGrain discSize={discGrainSize} />
                      <View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFillObject, styles.wheelScrollGrainMist]}
                      />
                    </Animated.View>
                  ) : undefined
                }
              />
            </View>
          </View>
        </View>
      );
    },
    [
      pageHeight,
      reel.activeIndex,
      reel.nextIndex,
      reel.onPrimaryBulbPhaseChange,
      reel.primaryWheelScrollFrostStyle,
      wheelFrostVisualIntensity,
      rounds,
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
        <View
          style={[styles.clip, { height: pageHeight }]}
          {...(Platform.OS === "web"
            ? {
                tabIndex: 0 as 0,
                onWheel: (
                  e:
                    | { nativeEvent?: { deltaY?: number }; deltaY?: number }
                    | { nativeEvent: { deltaY?: number } }
                ) => {
                  const ne = (e as { nativeEvent?: { deltaY?: number } }).nativeEvent;
                  const dy = ne?.deltaY ?? (e as { deltaY?: number }).deltaY;
                  if (dy == null || dy === 0) return;
                  reel.pokeWebWheelScrollBlur(dy);
                },
              }
            : {})}
        >
          <GestureDetector gesture={reel.panGesture}>
            <Animated.View
              collapsable={false}
              needsOffscreenAlphaCompositing={false}
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
              styles.reelScrimLayer,
              { backgroundColor: pageTheme.scrimBase },
              reel.motionScrimStyle,
            ]}
          />

          {Platform.OS !== "web" && stripVisualIntensity > 0.18 ? (
            <View
              pointerEvents="none"
              style={[styles.reelBottomBlurDock, { opacity: 0.38 * stripVisualIntensity }]}
            >
              <BlurView
                intensity={Math.round(48 * stripVisualIntensity)}
                tint="light"
                style={StyleSheet.absoluteFillObject}
                {...(Platform.OS === "android"
                  ? { experimentalBlurMethod: "dimezisBlurView" as const }
                  : {})}
              />
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, { backgroundColor: pageTheme.headerStripe, opacity: 0.09 }]}
              />
            </View>
          ) : null}

          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.reelCueLayer, reel.bottomCueScrollFadeStyle]}
          >
            <ReelActionCue
              phase={activeCuePhase}
              staticPresentation={scrollCueLite}
              accentStripe={pageTheme.headerStripe}
              blurIntensity={stripVisualIntensity}
            />
          </Animated.View>
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
  reelScrimLayer: {
    zIndex: 2,
  },
  reelBottomBlurDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 112,
    zIndex: 3,
    overflow: "hidden",
  },
  reelCueLayer: {
    zIndex: 4,
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
  wheelScrollGrainLayer: {
    zIndex: 40,
    elevation: 40,
  },
  wheelScrollGrainMist: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
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
  cueCast: {
    shadowColor: Neo.accentInk,
    shadowOffset: Neo.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  cueShell: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cueFg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    position: "relative",
  },
  cueText: {
    fontWeight: "900",
    color: Neo.ink,
    fontSize: 14,
    letterSpacing: 0.35,
    marginLeft: 2,
  },
  cueTextOnAccent: {
    color: Neo.textOnDark,
  },
  claimedRoundHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  claimedRoundTitle: {
    flexShrink: 1,
    color: Neo.ink,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  prizeRecapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: Neo.borderThin,
    borderTopColor: "rgba(10, 10, 10, 0.14)",
  },
  prizeRecap: {
    flex: 1,
    minWidth: 0,
    fontSize: 26,
    fontWeight: "900",
    color: Neo.neonYellow,
  },
});
