import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runHapticImpact, runHapticNotification } from "../../../src/utils/haptics";
import type { ViewStyle } from "react-native";
import { Platform, unstable_batchedUpdates as rnBatchedUpdates } from "react-native";

/** RN Web does not expose `unstable_batchedUpdates`; React 18 batches setState anyway. */
function batchedUpdates(fn: () => void): void {
  if (typeof rnBatchedUpdates === "function") {
    rnBatchedUpdates(fn);
    return;
  }
  fn();
}
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  clamp,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { REEL_STRIP } from "../reelStripConstants";
import type { BulbRingPhase } from "../bulbRingPhase";
import { computeMaxActiveIndex, computeStripIndexAfterClaim } from "../reelStripModel";
import type { ScrollWheelRound } from "../reelStripModel";

const { gesture: G, springs: S, visuals: V, commitTimingMs } = REEL_STRIP;

export type UseReelStripEngineArgs = {
  pageHeight: number;
  rounds: ScrollWheelRound[];
  /** Align strip with run wheel index on mount / run reset. */
  initialActiveIndex?: number;
  /** When this changes, snap strip index (new run) without mid-game resync. */
  bootRunId?: string;
  /** Return false to cancel reel advance (store did not commit the claim). */
  onClaimed: (roundIndex: number) => boolean;
  /** When false after a successful claim, strip index stays put (boss cycle dismiss). */
  shouldAdvanceStripAfterClaim?: (roundIndex: number) => boolean;
  /** Commit pending wheel layout before swipe spring (avoids slice-count pop mid-transition). */
  onPrepareAdvance?: () => void;
  growToMinLength?: (minLength: number) => void;
  /** Fired after the strip commits to the next reel (successful swipe). */
  onReelAdvanced?: () => void;
  /** Fired after swipe spring settles (translateY reset). */
  onStripSettled?: () => void;
  /**
   * Multiplier for drag-time strip opacity + scrim (0 = off for reduce motion, 1 = full).
   * Updated on the UI thread via shared value for worklets.
   */
  stripVisualIntensity?: number;
  /**
   * Optional multiplier for wheel frost only. When set, can stay positive while
   * `stripVisualIntensity` is 0 so reduce-motion users still get a muted wheel blur.
   */
  wheelFrostVisualIntensity?: number;
  /** When false, reel pan won't claim touches (unsticks UI during store-driven spin). */
  panEnabled?: boolean;
};

export type ReelStripEngine = {
  activeIndex: number;
  roundCount: number;
  nextIndex: number | null;
  /** Block wheel / pan while advancing, spinning, or commit spring. */
  interactionLocked: boolean;
  panGesture: ReturnType<typeof Gesture.Pan>;
  stripStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  motionScrimStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  /** Fades the fixed bottom Spin/Next cue while the strip moves toward the next reel (UI-thread). */
  bottomCueScrollFadeStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  /** Cross-fade layer for next wheel page tint (0 = current, 1 = next). */
  stripPageBlendStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  /**
   * For the primary reel only: frost layer from strip pan (`translateY`) or web wheel impulse;
   * opacity scales with `stripVisualIntensity`.
   */
  primaryWheelScrollFrostStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  /**
   * Web: route `deltaY` from a `wheel` event so blur reacts to mouse/trackpad scrolling
   * (native uses pan `translateY` only).
   */
  pokeWebWheelScrollBlur: (deltaY: number) => void;
  setSpinningSafe: (spinning: boolean) => void;
  onPrimaryBulbPhaseChange: (phase: BulbRingPhase) => void;
  /** Programmatic claim — same as swipe-up when round is `won`. */
  requestAdvance: () => void;
  /** Snap strip to a wheel index without advance animation (heal store/reel desync). */
  snapToIndex: (index: number) => void;
  /** True while the user is dragging the strip past the scroll threshold. */
  stripScrolling: boolean;
  /** True while the strip spring animation is running after a swipe. */
  stripSpringing: boolean;
};

/**
 * Owns reel-strip shared values, pan gesture, advance-after-spring, and grow debounce.
 * Shared by the roguelike run reel (`RunWheelFeed`).
 */
export function useReelStripEngine({
  pageHeight,
  rounds,
  initialActiveIndex = 0,
  bootRunId,
  onClaimed,
  shouldAdvanceStripAfterClaim,
  onPrepareAdvance,
  growToMinLength,
  onReelAdvanced,
  onStripSettled,
  stripVisualIntensity = 1,
  wheelFrostVisualIntensity: wheelFrostVisualIntensityProp,
  panEnabled = true,
}: UseReelStripEngineArgs): ReelStripEngine {
  const pageHStable = Math.max(1, Math.round(pageHeight));

  const roundsRef = useRef(rounds);
  roundsRef.current = rounds;
  const onClaimedRef = useRef(onClaimed);
  onClaimedRef.current = onClaimed;
  const shouldAdvanceStripRef = useRef(shouldAdvanceStripAfterClaim);
  shouldAdvanceStripRef.current = shouldAdvanceStripAfterClaim;
  const onReelAdvancedRef = useRef(onReelAdvanced);
  onReelAdvancedRef.current = onReelAdvanced;
  const onStripSettledRef = useRef(onStripSettled);
  onStripSettledRef.current = onStripSettled;
  const onPrepareAdvanceRef = useRef(onPrepareAdvance);
  onPrepareAdvanceRef.current = onPrepareAdvance;

  const mountedRef = useRef(true);
  const advanceBusyRef = useRef(false);
  const growDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeStart = Math.max(0, Math.min(initialActiveIndex, Math.max(0, rounds.length - 1)));
  const [activeIndex, setActiveIndex] = useState(safeStart);
  const activeIndexRef = useRef(safeStart);
  activeIndexRef.current = activeIndex;

  const [isSpinning, setIsSpinning] = useState(false);
  const isSpinningRef = useRef(false);
  const [advanceBusy, setAdvanceBusy] = useState(false);
  const [stripSpringing, setStripSpringing] = useState(false);
  const [stripScrolling, setStripScrolling] = useState(false);
  const stripScrollingRef = useRef(false);

  const translateY = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const pageH = useSharedValue(pageHStable);

  useEffect(() => {
    if (bootRunId == null) return;
    const next = Math.max(0, Math.min(initialActiveIndex, Math.max(0, rounds.length - 1)));
    setActiveIndex(next);
    activeIndexRef.current = next;
    translateY.value = 0;
  }, [bootRunId, initialActiveIndex, rounds.length, translateY]);
  const canSwipeNext = useSharedValue(false);
  const busy = useSharedValue(false);
  const stripVisualSV = useSharedValue(stripVisualIntensity);
  const wheelFrostVisualSV = useSharedValue(
    wheelFrostVisualIntensityProp ?? stripVisualIntensity
  );

  /** Web-only shortcut for blur when using wheel instead of drag (see `pokeWebWheelScrollBlur`). */
  const webWheelBlurImpulse = useSharedValue(0);

  useEffect(() => {
    stripVisualSV.value = stripVisualIntensity;
  }, [stripVisualIntensity, stripVisualSV]);

  useEffect(() => {
    wheelFrostVisualSV.value = wheelFrostVisualIntensityProp ?? stripVisualIntensity;
  }, [wheelFrostVisualIntensityProp, stripVisualIntensity, wheelFrostVisualSV]);

  const maxActive = useMemo(() => computeMaxActiveIndex(rounds), [rounds]);
  const roundCount = rounds.length;

  useEffect(() => {
    pageH.value = pageHStable;
  }, [pageHStable, pageH]);

  const publishStripScrolling = useCallback((scrolling: boolean) => {
    if (!mountedRef.current || stripScrollingRef.current === scrolling) return;
    stripScrollingRef.current = scrolling;
    setStripScrolling(scrolling);
  }, []);

  /** Only bridge scroll start/stop to React — not every pan frame (avoids 30–60 Hz re-renders). */
  useAnimatedReaction(
    () => {
      const h = Math.max(1, pageH.value);
      return Math.abs(translateY.value) / h > 0.02;
    },
    (scrolling, prev) => {
      if (scrolling !== prev) {
        runOnJS(publishStripScrolling)(scrolling);
      }
    },
    [publishStripScrolling]
  );

  useEffect(() => {
    const rs = roundsRef.current;
    const last = rs.length - 1;
    const lastWon = last >= 0 && rs[last]?.status === "won";
    canSwipeNext.value = activeIndex < maxActive || (activeIndex === last && lastWon);
  }, [activeIndex, canSwipeNext, maxActive, rounds]);

  useEffect(() => {
    busy.value = advanceBusy || isSpinning || stripSpringing;
  }, [advanceBusy, busy, isSpinning, stripSpringing]);

  useEffect(() => {
    isSpinningRef.current = false;
    setIsSpinning(false);
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex > maxActive) {
      setActiveIndex(maxActive);
      translateY.value = 0;
    }
  }, [activeIndex, maxActive, translateY]);

  useEffect(() => {
    if (growDebounceRef.current) clearTimeout(growDebounceRef.current);
    growDebounceRef.current = setTimeout(() => {
      growDebounceRef.current = null;
      if (!mountedRef.current) return;
      const min = Math.max(roundCount, activeIndex + REEL_STRIP.growAheadSlots);
      if (Number.isFinite(min) && min > 0) {
        growToMinLength?.(min);
      }
    }, REEL_STRIP.growDebounceMs);
    return () => {
      if (growDebounceRef.current) {
        clearTimeout(growDebounceRef.current);
        growDebounceRef.current = null;
      }
    };
  }, [activeIndex, growToMinLength, roundCount]);

  const lastRoundStatus = rounds[roundCount - 1]?.status ?? "locked";
  useEffect(() => {
    const last = roundCount - 1;
    if (last < 0) return;
    if (lastRoundStatus !== "won") return;
    /** Boss wheel: player swipes into cycle 2 — do not auto-claim on a timer. */
    if (activeIndexRef.current >= last) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled && mountedRef.current) onClaimedRef.current(last);
    }, REEL_STRIP.lastRoundAutoClaimDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [lastRoundStatus, roundCount]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      advanceBusyRef.current = false;
      if (growDebounceRef.current) {
        clearTimeout(growDebounceRef.current);
        growDebounceRef.current = null;
      }
      cancelAnimation(translateY);
    };
  }, [translateY]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const { webWheelDecayMs, webWheelDecayFactor } = V.wheelScrollBlur;
    const id = setInterval(() => {
      const next = webWheelBlurImpulse.value * webWheelDecayFactor;
      webWheelBlurImpulse.value = next < 0.012 ? 0 : next;
    }, webWheelDecayMs);
    return () => clearInterval(id);
  }, [webWheelBlurImpulse]);

  const pokeWebWheelScrollBlur = useCallback(
    (deltaY: number) => {
      if (Platform.OS !== "web") return;
      if (!Number.isFinite(deltaY) || deltaY === 0) return;
      const gain = V.wheelScrollBlur.webWheelImpulseGain;
      webWheelBlurImpulse.value = Math.min(1, webWheelBlurImpulse.value + Math.abs(deltaY) * gain);
    },
    [webWheelBlurImpulse]
  );

  const executeStripAdvance = useCallback(() => {
    if (!mountedRef.current) return;
    if (advanceBusyRef.current) return;

    const i = activeIndexRef.current;
    const rs = roundsRef.current;
    const len = rs.length;
    if (len === 0 || i < 0 || i > len - 1) {
      advanceBusyRef.current = false;
      busy.value = false;
      setStripSpringing(false);
      setAdvanceBusy(false);
      return;
    }
    if (rs[i]?.status !== "won") {
      advanceBusyRef.current = false;
      busy.value = false;
      setStripSpringing(false);
      setAdvanceBusy(false);
      return;
    }

    advanceBusyRef.current = true;
    busy.value = true;

    runHapticNotification(Haptics.NotificationFeedbackType.Success);

    try {
      onPrepareAdvanceRef.current?.();
    } catch {
      /* isolate failures */
    }

    let claimed = false;
    batchedUpdates(() => {
      try {
        claimed = onClaimedRef.current(i) === true;
      } catch {
        claimed = false;
      }
      if (!claimed) {
        return;
      }
      const advanceStrip = shouldAdvanceStripRef.current?.(i) !== false;
      if (advanceStrip) {
        const nextIndex = computeStripIndexAfterClaim(i, roundsRef.current);
        if (nextIndex == null) return;
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
        onReelAdvancedRef.current?.();
      }
    });

    if (!claimed) {
      advanceBusyRef.current = false;
      busy.value = false;
      setStripSpringing(false);
      setAdvanceBusy(false);
      translateY.value = 0;
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        translateY.value = 0;
        advanceBusyRef.current = false;
        busy.value = false;
        setStripSpringing(false);
        setAdvanceBusy(false);
        try {
          onStripSettledRef.current?.();
        } catch {
          /* isolate failures */
        }
      });
    });
  }, [busy, translateY]);

  const executeStripAdvanceRef = useRef(executeStripAdvance);
  executeStripAdvanceRef.current = executeStripAdvance;

  const runStripAdvanceOnJS = useCallback(() => {
    executeStripAdvanceRef.current();
  }, []);

  const armStripSpringStart = useCallback(() => {
    if (!mountedRef.current) return;
    runHapticImpact(Haptics.ImpactFeedbackStyle.Light);
    setStripSpringing(true);
    setAdvanceBusy(true);
  }, []);

  const stripSpringCancelled = useCallback(() => {
    advanceBusyRef.current = false;
    busy.value = false;
    if (!mountedRef.current) return;
    setStripSpringing(false);
    setAdvanceBusy(false);
  }, [busy]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(panEnabled)
        .failOffsetX([-G.failOffsetX, G.failOffsetX])
        .activeOffsetY([-G.activeOffsetY, G.activeOffsetY])
        .onStart(() => {
          if (busy.value) return;
          startTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
          if (busy.value) return;
          const h = pageH.value;
          if (!Number.isFinite(h) || h <= 0) return;
          const minY = canSwipeNext.value ? -h : 0;
          const maxY = 0;
          let next = startTranslateY.value + e.translationY;
          if (!Number.isFinite(next)) return;
          if (next > maxY) {
            const over = next - maxY;
            next = maxY + Math.sign(over) * Math.pow(Math.abs(over) / h, G.rubberExponent) * h * G.rubberStrength;
          } else if (next < minY) {
            const over = next - minY;
            next = minY + Math.sign(over) * Math.pow(Math.abs(over) / h, G.rubberExponent) * h * G.rubberStrength;
          }
          translateY.value = next;
        })
        .onEnd((e) => {
          if (busy.value) return;
          const h = pageH.value;
          if (!Number.isFinite(h) || h <= 0) return;
          const vy = e.velocityY;
          const y = translateY.value;
          const velLift = Math.min(
            G.commitVelocityLiftMax,
            Math.max(0, -vy) / G.commitVelocityLiftDivisor
          );
          const distCommit = y < -h * (G.commitDistanceRatio - velLift);
          const crossed = distCommit || (Number.isFinite(vy) && vy < G.commitFlickVelocity);
          if (crossed && canSwipeNext.value) {
            cancelAnimation(translateY);
            busy.value = true;
            runOnJS(armStripSpringStart)();
            translateY.value = withTiming(
              -h,
              {
                duration: commitTimingMs,
                easing: Easing.out(Easing.cubic),
              },
              (finished) => {
                if (!finished) {
                  translateY.value = withSpring(0, S.cancel);
                  busy.value = false;
                  runOnJS(stripSpringCancelled)();
                  return;
                }
                runOnJS(runStripAdvanceOnJS)();
              }
            );
          } else {
            translateY.value = withSpring(0, {
              ...S.settle,
              velocity: Number.isFinite(vy) ? vy : 0,
            });
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs; gesture must stay one instance
    [armStripSpringStart, panEnabled, runStripAdvanceOnJS, stripSpringCancelled]
  );

  const stripStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const motionScrimStyle = useAnimatedStyle<ViewStyle>(() => {
    const h = Math.max(1, pageH.value);
    const p = Math.min(1, Math.abs(translateY.value) / h);
    const q = p * p;
    const mult = stripVisualSV.value;
    return {
      opacity: clamp(q * V.scrimOpacityQuad * mult + p * V.scrimOpacityLinear * mult, 0, V.scrimOpacityMax * mult),
    };
  });

  const bottomCueScrollFadeStyle = useAnimatedStyle<ViewStyle>(() => {
    const h = Math.max(1, pageH.value);
    const ty = translateY.value;
    return {
      opacity: interpolate(ty, [-h, 0], [0, 1], Extrapolation.CLAMP),
    };
  });

  const stripPageBlendStyle = useAnimatedStyle<ViewStyle>(() => {
    const h = Math.max(1, pageH.value);
    const p = clamp(-translateY.value / h, 0, 1);
    return { opacity: p };
  });

  const primaryWheelScrollFrostStyle = useAnimatedStyle<ViewStyle>(() => {
    const h = Math.max(1, pageH.value);
    const ty = translateY.value;
    const panP = Math.min(1, Math.abs(ty) / h);
    const wheelP = Math.min(1, Math.max(webWheelBlurImpulse.value, 0));
    const p = Math.max(panP, wheelP);
    const mult = wheelFrostVisualSV.value;
    const cap = V.wheelScrollBlur.overlayOpacityMax;
    if (!(mult > 1e-6)) {
      return { opacity: 0 };
    }
    return {
      opacity: clamp(p * mult * cap, 0, cap),
    };
  });

  const snapToIndex = useCallback(
    (index: number) => {
      if (advanceBusyRef.current) return;
      const next = Math.max(0, Math.min(index, Math.max(0, roundsRef.current.length - 1)));
      activeIndexRef.current = next;
      setActiveIndex(next);
      translateY.value = 0;
    },
    [translateY]
  );

  const setSpinningSafe = useCallback((spinning: boolean) => {
    if (!mountedRef.current || isSpinningRef.current === spinning) return;
    isSpinningRef.current = spinning;
    setIsSpinning(spinning);
  }, []);

  const onPrimaryBulbPhaseChange = useCallback(
    (phase: BulbRingPhase) => {
      setSpinningSafe(phase === "spinning");
    },
    [setSpinningSafe]
  );

  const nextIndex = activeIndex + 1 < roundCount ? activeIndex + 1 : null;
  const interactionLocked = advanceBusy || stripSpringing;

  return useMemo(
    () => ({
      activeIndex,
      roundCount,
      nextIndex,
      interactionLocked,
      panGesture,
      stripStyle,
      motionScrimStyle,
      bottomCueScrollFadeStyle,
      stripPageBlendStyle,
      primaryWheelScrollFrostStyle,
      pokeWebWheelScrollBlur,
      setSpinningSafe,
      onPrimaryBulbPhaseChange,
      requestAdvance: executeStripAdvance,
      snapToIndex,
      stripScrolling,
      stripSpringing,
    }),
    [
      activeIndex,
      advanceBusy,
      bottomCueScrollFadeStyle,
      executeStripAdvance,
      interactionLocked,
      motionScrimStyle,
      nextIndex,
      onPrimaryBulbPhaseChange,
      panGesture,
      pokeWebWheelScrollBlur,
      primaryWheelScrollFrostStyle,
      roundCount,
      setSpinningSafe,
      snapToIndex,
      stripPageBlendStyle,
      stripScrolling,
      stripSpringing,
      stripStyle,
    ]
  );
}
