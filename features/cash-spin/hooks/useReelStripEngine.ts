import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import { unstable_batchedUpdates } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { REEL_STRIP } from "../reelStripConstants";
import type { BulbRingPhase } from "../bulbRingPhase";
import { computeMaxActiveIndex } from "../reelStripModel";
import type { ScrollWheelRound } from "./useScrollTheWheelRounds";

const { gesture: G, springs: S, visuals: V } = REEL_STRIP;

export type UseReelStripEngineArgs = {
  pageHeight: number;
  rounds: ScrollWheelRound[];
  onClaimed: (roundIndex: number) => void;
  growToMinLength?: (minLength: number) => void;
  /** Fired after the strip commits to the next reel (successful swipe). */
  onReelAdvanced?: () => void;
  /**
   * Multiplier for drag-time strip opacity + scrim (0 = off for reduce motion, 1 = full).
   * Updated on the UI thread via shared value for worklets.
   */
  stripVisualIntensity?: number;
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
  setSpinningSafe: (spinning: boolean) => void;
  onPrimaryBulbPhaseChange: (phase: BulbRingPhase) => void;
};

/**
 * Owns reel-strip shared values, pan gesture, advance-after-spring, and grow debounce.
 * Keeps `CashSpinScrollFeed` focused on layout + per-round rendering.
 */
export function useReelStripEngine({
  pageHeight,
  rounds,
  onClaimed,
  growToMinLength,
  onReelAdvanced,
  stripVisualIntensity = 1,
}: UseReelStripEngineArgs): ReelStripEngine {
  const pageHStable = Math.max(1, Math.round(pageHeight));

  const roundsRef = useRef(rounds);
  roundsRef.current = rounds;
  const onClaimedRef = useRef(onClaimed);
  onClaimedRef.current = onClaimed;
  const onReelAdvancedRef = useRef(onReelAdvanced);
  onReelAdvancedRef.current = onReelAdvanced;

  const mountedRef = useRef(true);
  const advanceBusyRef = useRef(false);
  const growDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const [isSpinning, setIsSpinning] = useState(false);
  const [advanceBusy, setAdvanceBusy] = useState(false);
  const [stripSpringing, setStripSpringing] = useState(false);

  const translateY = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const pageH = useSharedValue(pageHStable);
  const canSwipeNext = useSharedValue(false);
  const busy = useSharedValue(false);
  const stripVisualSV = useSharedValue(stripVisualIntensity);

  useEffect(() => {
    stripVisualSV.value = stripVisualIntensity;
  }, [stripVisualIntensity, stripVisualSV]);

  const maxActive = useMemo(() => computeMaxActiveIndex(rounds), [rounds]);
  const roundCount = rounds.length;

  useEffect(() => {
    pageH.value = pageHStable;
  }, [pageHStable, pageH]);

  useEffect(() => {
    canSwipeNext.value = activeIndex < maxActive;
  }, [activeIndex, canSwipeNext, maxActive]);

  useEffect(() => {
    busy.value = advanceBusy || isSpinning || stripSpringing;
  }, [advanceBusy, busy, isSpinning, stripSpringing]);

  useEffect(() => {
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

  const executeStripAdvance = useCallback(() => {
    if (!mountedRef.current) return;
    if (advanceBusyRef.current) return;
    advanceBusyRef.current = true;
    busy.value = true;
    setStripSpringing(false);
    setAdvanceBusy(true);

    const i = activeIndexRef.current;
    const rs = roundsRef.current;
    const len = rs.length;
    if (i >= len - 1) {
      advanceBusyRef.current = false;
      busy.value = false;
      setAdvanceBusy(false);
      setStripSpringing(false);
      return;
    }

    unstable_batchedUpdates(() => {
      if (rs[i]?.status === "won") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
          onClaimedRef.current(i);
        } catch {
          /* isolate native bridge failures */
        }
      }
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(0, len - 1)));
      onReelAdvancedRef.current?.();
    });

    queueMicrotask(() => {
      if (!mountedRef.current) return;
      advanceBusyRef.current = false;
      busy.value = false;
      setAdvanceBusy(false);
    });
  }, []);

  const executeStripAdvanceRef = useRef(executeStripAdvance);
  executeStripAdvanceRef.current = executeStripAdvance;

  const runStripAdvanceOnJS = useCallback(() => {
    executeStripAdvanceRef.current();
  }, []);

  const armStripSpringStart = useCallback(() => {
    if (!mountedRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            translateY.value = withSpring(
              -h,
              {
                ...S.commit,
                velocity: Number.isFinite(vy) ? vy : 0,
              },
              (finished) => {
                if (!finished) {
                  translateY.value = withSpring(0, S.cancel);
                  busy.value = false;
                  runOnJS(stripSpringCancelled)();
                  return;
                }
                translateY.value = 0;
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
    [armStripSpringStart, runStripAdvanceOnJS, stripSpringCancelled]
  );

  const stripStyle = useAnimatedStyle<ViewStyle>(() => {
    const h = Math.max(1, pageH.value);
    const p = Math.min(1, Math.abs(translateY.value) / h);
    const mult = stripVisualSV.value;
    return {
      transform: [{ translateY: translateY.value }],
      opacity: 1 - p * V.stripOpacityDragFactor * mult,
    };
  });

  const motionScrimStyle = useAnimatedStyle<ViewStyle>(() => {
    const h = Math.max(1, pageH.value);
    const p = Math.min(1, Math.abs(translateY.value) / h);
    const q = p * p;
    const mult = stripVisualSV.value;
    return {
      opacity: clamp(q * V.scrimOpacityQuad * mult + p * V.scrimOpacityLinear * mult, 0, V.scrimOpacityMax * mult),
    };
  });

  const setSpinningSafe = useCallback((spinning: boolean) => {
    if (!mountedRef.current) return;
    setIsSpinning(spinning);
  }, []);

  const onPrimaryBulbPhaseChange = useCallback(
    (phase: BulbRingPhase) => {
      setSpinningSafe(phase === "spinning");
    },
    [setSpinningSafe]
  );

  const nextIndex = activeIndex + 1 < roundCount ? activeIndex + 1 : null;
  const interactionLocked = advanceBusy || isSpinning || stripSpringing;

  return {
    activeIndex,
    roundCount,
    nextIndex,
    interactionLocked,
    panGesture,
    stripStyle,
    motionScrimStyle,
    setSpinningSafe,
    onPrimaryBulbPhaseChange,
  };
}
