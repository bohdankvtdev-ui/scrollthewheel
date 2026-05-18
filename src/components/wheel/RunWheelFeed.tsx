import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlicePrizeSheet } from "./SlicePrizeSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { SpinWheelStage } from "../../../features/cash-spin/components/SpinWheelStage";
import {
  isCompactCashSpinWindow,
  stripVisualIntensityForDevice,
  WHEEL_FROST_INTENSITY_REDUCE_MOTION,
} from "../../../features/cash-spin/cashStripPerformance";
import { useReelStripEngine } from "../../../features/cash-spin/hooks/useReelStripEngine";
import { REEL_STRIP } from "../../../features/cash-spin/reelStripConstants";
import { RUN_PAGE_BACKGROUND } from "../../game/runVisual";
import {
  computeSpinWheelTextSize,
  computeWheelInnerSize,
} from "../../../lib/layout/wheelFrame";
import { CASH_SPIN_WHEEL_PROFILE } from "../../../lib/wheel/profiles";
import { spinSafetyTimeoutMs } from "../../../lib/wheel";
import { resolveWheelPhysics } from "../../../lib/wheel/resolveWheelPhysics";
import { Neo } from "../../../theme/neoBrutal";
import type { SpinWheelRef } from "../../../wheel/types";
import { useRunReelRounds } from "../../hooks/useRunReelRounds";
import { buildResolveContext } from "../../hooks/useWheelModifiers";
import { resolveSlice } from "../../systems/ProbabilityResolver";
import { getBulbRingPalette, getWheelSegmentColors } from "../../game/content/sliceVisualTheme";
import { getArchetypeForConfigId } from "../../game/wheels/database";
import { RunManager } from "../../systems/RunManager";
import { syncRunWheels } from "../../systems/WheelSystem";
import type { RunState } from "../../schemas";
import { deriveHubMode, deriveSpinLocked } from "../../game/tactics/wheelHubState";
import {
  buildGambleSlices,
  getGambleSliceById,
  overlayGambleWheel,
} from "../../game/tactics/gambleWheel";
import { runReelFeedKey } from "../../game/runState/runReelFeedKey";
import { useRunWheelUi } from "../../hooks/useRunWheelUi";
import { useRunStore } from "../../stores/runStore";
import {
  shouldDismissNoticeOnScroll,
  showRunInfoNotice,
  showRunNotice,
} from "../../game/notices/runNotices";
import { useRunToastStore } from "../../stores/runToastStore";
import { sliceWheelCaptionForRun } from "../../utils/sliceMoneyDisplay";
import type { SpinWheelItem } from "../../../wheel/types";

type RunWheelFeedProps = {
  run: RunState;
  pageHeight: number;
};

const NOOP = () => {};

function physicsForProfile(profileId: string) {
  const base = CASH_SPIN_WHEEL_PROFILE.physics;
  if (profileId === "boss") {
    return resolveWheelPhysics({
      ...base,
      baseDurationMs: 7200,
      extraFullTurns: { min: 6, max: 12 },
    });
  }
  return base;
}

const RunWheelSlot = memo(function RunWheelSlot({
  roundIndex,
  pageHeight,
  run,
  wheelInnerSize,
  textSize,
  textColor,
  spinWheelRef,
  onSpinComplete,
  onExternalSpinPress,
  onHubClaimPress,
  hubMode,
  spinLocked,
  ringPhaseResetKey,
  onBulbRingPhaseChange,
  scrollGrainOverlay,
  sliceEraseMode,
  isActiveWheel,
  gambleFlipActive,
  spinArmEpoch,
  onBanishSlice,
  isSpinning,
  clearSpinInteraction,
}: {
  roundIndex: number;
  pageHeight: number;
  run: RunState;
  wheelInnerSize: number;
  textSize: number;
  textColor: string;
  spinWheelRef: React.RefObject<SpinWheelRef | null>;
  onSpinComplete: (roundIndex: number, item: { id: string; label?: string }) => void;
  onExternalSpinPress: () => void;
  onHubClaimPress: () => void;
  hubMode: "spin" | "claim" | "busy";
  spinLocked: boolean;
  ringPhaseResetKey: number;
  onBulbRingPhaseChange?: (phase: "idle" | "spinning" | "victory") => void;
  scrollGrainOverlay?: React.ReactNode;
  sliceEraseMode: boolean;
  isActiveWheel: boolean;
  gambleFlipActive: boolean;
  spinArmEpoch: number;
  onBanishSlice: (sliceIndex: number) => void;
  isSpinning: boolean;
  clearSpinInteraction: () => void;
}) {
  const baseWheel = run.wheels[roundIndex];
  const wheel = useMemo(() => {
    if (baseWheel == null || !gambleFlipActive || !isActiveWheel) return baseWheel;
    return overlayGambleWheel(baseWheel);
  }, [baseWheel, gambleFlipActive, isActiveWheel]);
  const [previewSliceIndex, setPreviewSliceIndex] = useState<number | null>(null);
  const eraseArmed = sliceEraseMode && isActiveWheel && !spinLocked && !isSpinning;

  useEffect(() => {
    if (isSpinning) setPreviewSliceIndex(null);
  }, [isSpinning]);

  useEffect(() => {
    if (!isActiveWheel) return;
    return () => {
      const st = useRunStore.getState();
      if (st.ui.isSpinning && st.ui.spinWheelIndex === roundIndex) {
        st.clearSpinInteraction();
      }
    };
  }, [isActiveWheel, roundIndex]);

  const wheelPhysics = useMemo(
    () => physicsForProfile(wheel?.definition.physicsProfileId ?? "default"),
    [wheel?.definition.physicsProfileId]
  );

  const colors = useMemo(
    () => (wheel != null ? getWheelSegmentColors(wheel.slices) : []),
    [wheel?.slices]
  );

  const bulbRingPalette = useMemo(() => {
    const archetype =
      wheel?.definition.wheelConfigId != null
        ? getArchetypeForConfigId(wheel.definition.wheelConfigId)
        : undefined;
    return getBulbRingPalette(archetype);
  }, [wheel?.definition.wheelConfigId]);

  const previewSlice =
    wheel != null && previewSliceIndex != null
      ? wheel.slices[previewSliceIndex] ?? null
      : null;

  const resolveContext = useMemo(
    () => (wheel != null ? buildResolveContext(run, wheel, roundIndex) : undefined),
    [run, wheel, roundIndex]
  );

  const wheelData = useMemo((): SpinWheelItem[] => {
    if (wheel == null) return [];
    return wheel.spinItems.map((item, i) => {
      const slice = wheel.slices[i];
      if (slice == null) return item;
      return {
        ...item,
        shortLabel: sliceWheelCaptionForRun(run, slice, roundIndex),
      };
    });
  }, [run.money, run.winStreak, run.perks.length, roundIndex, wheel]);

  if (wheel == null) return <View style={{ height: pageHeight }} />;

  return (
    <View style={[styles.slotRow, styles.slotRowCentered, { height: pageHeight }]}>
      <SlicePrizeSheet
        slice={previewSlice}
        sliceIndex={previewSliceIndex}
        visible={previewSlice != null}
        onClose={() => setPreviewSliceIndex(null)}
        wheelSlices={wheel.slices}
        resolveContext={resolveContext}
      />
      {eraseArmed ? (
        <View style={styles.eraseBanner} pointerEvents="none">
          <MaterialCommunityIcons name="eraser" size={18} color={Neo.ink} />
          <Text style={[styles.eraseBannerText, { fontFamily: FONT_BEBAS_NEUE }]}>
            Tap a wedge to laser
          </Text>
        </View>
      ) : null}
      <View style={[styles.wheelSlotShell, eraseArmed && styles.wheelSlotErase]}>
        <View style={[styles.wheelPad, eraseArmed && styles.wheelPadErase]}>
          <SpinWheelStage
            data={wheelData}
            wheelInnerSize={wheelInnerSize}
            textSize={textSize}
            wheelPhysics={wheelPhysics}
            segmentColors={colors}
            bulbRingPalette={bulbRingPalette}
            textColor={textColor}
            ringPhaseResetKey={ringPhaseResetKey}
            spinLocked={spinLocked}
            spinWheelRef={spinWheelRef}
            externalSpinControl
            hubMode={hubMode}
            onHubClaimPress={onHubClaimPress}
            sliceLabelMode="icons"
            hubAnimSubtle
            onExternalSpinPress={onExternalSpinPress}
            onBulbRingPhaseChange={onBulbRingPhaseChange}
            onSpinComplete={(item) => onSpinComplete(roundIndex, item)}
            scrollGrainOverlay={scrollGrainOverlay}
            spinArmEpoch={isActiveWheel ? spinArmEpoch : 0}
            onSpinInterrupted={isActiveWheel ? clearSpinInteraction : undefined}
            slicePressEnabled={eraseArmed || (!spinLocked && !isSpinning)}
            onSlicePress={(index) => {
              if (eraseArmed) {
                onBanishSlice(index);
                return;
              }
              setPreviewSliceIndex(index);
            }}
          />
        </View>
      </View>
    </View>
  );
});

export const RunWheelFeed = memo(function RunWheelFeed({ run, pageHeight }: RunWheelFeedProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const {
    awaitingClaim,
    isSpinning,
    gambleFlipActive,
    sliceEraseMode,
    lastResultLabel,
  } = useRunWheelUi();
  const [spinArmEpoch, setSpinArmEpoch] = useState(0);
  const prevWheelIndexRef = useRef(run.wheelIndex);
  const dismissToast = useRunToastStore((s) => s.dismiss);
  const toastVisible = useRunToastStore((s) => s.toast != null);
  const clearSpinInteraction = useCallback(
    () => useRunStore.getState().clearSpinInteraction(),
    []
  );

  const rounds = useRunReelRounds(run, awaitingClaim, lastResultLabel, gambleFlipActive);
  const spinWheelRef = useRef<SpinWheelRef>(null);
  const pendingSliceRef = useRef<{
    wheelIndex: number;
    sliceId: string;
    sliceIndex: number;
    isGambleFlip?: boolean;
  } | null>(null);

  const reduceMotionBoot = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(reduceMotionBoot);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => sub.remove();
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

  const wheelInnerSize = useMemo(
    () => computeWheelInnerSize(Math.min(winW, winH)),
    [winW, winH]
  );
  const textSize = useMemo(() => computeSpinWheelTextSize(wheelInnerSize), [wheelInnerSize]);
  const textColor = Neo.wheelSliceLabel;

  const reelEngineRef = useRef<ReturnType<typeof useReelStripEngine> | null>(null);

  const onReelAdvanced = useCallback(() => {
    const store = useRunStore.getState();
    store.clearSpinInteraction();
    reelEngineRef.current?.onPrimaryBulbPhaseChange("idle");
    store.healRunUi();
  }, []);

  const onClaimed = useCallback((roundIndex: number): boolean => {
    const store = useRunStore.getState();
    const current = store.run;
    if (current == null || roundIndex !== current.wheelIndex) return false;
    if (!store.ui.awaitingClaim) return false;
    return store.claimAndAdvance();
  }, []);

  const handleBanishSlice = useCallback((wheelIndex: number, sliceIndex: number) => {
    const result = useRunStore.getState().banishSliceAt(wheelIndex, sliceIndex);
    if (result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showRunNotice({
        type: "success",
        title: "Wedge removed",
        body: "One fewer slice on this wheel",
        icon: "ray-start",
      });
      return;
    }
    showRunInfoNotice(result.reason);
  }, []);

  const reel = useReelStripEngine({
    pageHeight,
    rounds,
    initialActiveIndex: run.wheelIndex,
    bootRunId: run.runId,
    onClaimed,
    onPrepareAdvance: () => useRunStore.getState().commitWheelLayout(),
    onReelAdvanced,
    stripVisualIntensity,
    wheelFrostVisualIntensity,
  });
  reelEngineRef.current = reel;

  const handleHubClaim = useCallback(() => {
    const { ui } = useRunStore.getState();
    if (ui.awaitingClaim || ui.isSpinning || ui.gambleFlipActive) return;
    reel.requestAdvance();
  }, [reel]);

  const handleExternalSpinPress = useCallback(() => {
    let current = useRunStore.getState().run;
    if (current == null) return;
    const synced = syncRunWheels(current);
    if (synced !== current) {
      useRunStore.setState({ run: synced });
      current = synced;
    }

    const ri = current.wheelIndex;
    const wheel = current.wheels[ri];
    const flipActive = useRunStore.getState().ui.gambleFlipActive;
    if (wheel == null || !RunManager.canSpin(current, ri) || isSpinning) return;
    if (awaitingClaim && !flipActive) return;

    if (flipActive) {
      const slices = buildGambleSlices();
      const ctx = buildResolveContext(current, wheel);
      const { index, slice } = resolveSlice(slices, ctx);
      pendingSliceRef.current = {
        wheelIndex: ri,
        sliceId: slice.id,
        sliceIndex: index,
        isGambleFlip: true,
      };
    } else {
      const ctx = buildResolveContext(current, wheel);
      const { index, slice } = resolveSlice(wheel.slices, ctx);
      pendingSliceRef.current = { wheelIndex: ri, sliceId: slice.id, sliceIndex: index };
    }
    setSpinArmEpoch((e) => e + 1);
    useRunStore.getState().setSpinning(true);
    reel.setSpinningSafe(true);
    spinWheelRef.current?.spinToIndex(pendingSliceRef.current.sliceIndex);
  }, [awaitingClaim, isSpinning, reel]);

  const handleSpinComplete = useCallback(
    (roundIndex: number, item: { id: string; label?: string }) => {
      const store = useRunStore.getState();
      store.setSpinning(false);
      reel.setSpinningSafe(false);
      const current = useRunStore.getState().run;
      if (current == null || roundIndex !== current.wheelIndex) return;
      const pending = pendingSliceRef.current;
      const slice = pending?.isGambleFlip
        ? getGambleSliceById(pending.sliceId)
        : (() => {
            const wheel = current.wheels[roundIndex];
            return pending?.wheelIndex === roundIndex
              ? wheel?.slices[pending.sliceIndex] ??
                  wheel?.slices.find((s) => s.id === pending.sliceId)
              : wheel?.slices.find((s) => s.id === item.id);
          })();
      const wasGamble = pending?.isGambleFlip === true;
      pendingSliceRef.current = null;
      if (slice == null) {
        store.setSpinning(false);
        reel.setSpinningSafe(false);
        if (wasGamble) {
          useRunStore.setState((s) => ({
            ui: {
              ...s.ui,
              gambleFlipActive: false,
              isSpinning: false,
              spinWheelIndex: null,
              awaitingClaim: true,
            },
          }));
        }
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (pending?.isGambleFlip) {
        store.applyGambleFlipResult(roundIndex, slice.id);
      } else {
        store.applySpinResult(roundIndex, slice.id);
      }
    },
    [reel]
  );

  const activeWheelPhysics = useMemo(() => {
    const w = run.wheels[run.wheelIndex];
    return physicsForProfile(w?.definition.physicsProfileId ?? "default");
  }, [run.wheelIndex, run.wheels]);

  const spinGuardMs = useMemo(
    () => spinSafetyTimeoutMs(activeWheelPhysics) + 400,
    [activeWheelPhysics]
  );

  useEffect(() => {
    if (!isSpinning) return;
    const t = setTimeout(() => {
      const state = useRunStore.getState();
      if (state.ui.isSpinning) {
        state.clearSpinInteraction();
        reel.setSpinningSafe(false);
        state.healRunUi();
      }
    }, spinGuardMs);
    return () => clearTimeout(t);
  }, [isSpinning, reel, spinGuardMs]);

  useEffect(() => {
    if (prevWheelIndexRef.current === run.wheelIndex) return;
    prevWheelIndexRef.current = run.wheelIndex;
    useRunStore.getState().clearSpinInteraction();
    reel.setSpinningSafe(false);
    reel.onPrimaryBulbPhaseChange("idle");
  }, [reel, run.wheelIndex]);

  useEffect(() => {
    if (reel.interactionLocked) return;
    if (reel.activeIndex === run.wheelIndex) return;
    reel.snapToIndex(run.wheelIndex);
    reel.setSpinningSafe(false);
    useRunStore.getState().clearSpinInteraction();
    reel.onPrimaryBulbPhaseChange("idle");
  }, [reel, run.wheelIndex]);

  useEffect(() => {
    if (reel.activeIndex !== run.wheelIndex) return;
    if (awaitingClaim || isSpinning) return;
    useRunStore.getState().healRunUi();
  }, [awaitingClaim, isSpinning, reel.activeIndex, run.wheelIndex]);

  const [revealNextSlot, setRevealNextSlot] = useState(false);
  const scrolling = reel.stripScrolling;

  useEffect(() => {
    if (!scrolling) {
      setRevealNextSlot(false);
      return;
    }
    if (toastVisible && shouldDismissNoticeOnScroll()) dismissToast();
    const t = setTimeout(() => setRevealNextSlot(true), 150);
    return () => clearTimeout(t);
  }, [scrolling, dismissToast, toastVisible]);

  useEffect(() => {
    if (isSpinning && toastVisible) dismissToast();
  }, [dismissToast, isSpinning, toastVisible]);

  const mountNextStripSlot =
    reel.nextIndex != null &&
    (scrolling || revealNextSlot || reel.stripSpringing);

  const renderStripBuffer = useCallback(
    (buffer: "a" | "b") => {
      const roundIndex = buffer === "a" ? reel.activeIndex : reel.nextIndex;
      if (buffer === "b" && (roundIndex == null || !mountNextStripSlot)) {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }
      const ri = roundIndex as number;
      const round = rounds[ri];

      const isActive = ri === reel.activeIndex;
      const hubMode = deriveHubMode({
        run,
        roundIndex: ri,
        isSpinning,
        awaitingClaim,
        gambleFlipActive,
        isReelActive: isActive,
        round,
      });
      const spinLocked = deriveSpinLocked(hubMode, isSpinning);
      const listenBulb = buffer === "a";
      return (
        <RunWheelSlot
          key={buffer === "a" ? "reel-slot-a" : "reel-slot-b"}
          roundIndex={ri}
          pageHeight={pageHeight}
          run={run}
          wheelInnerSize={wheelInnerSize}
          textSize={textSize}
          textColor={textColor}
          spinWheelRef={buffer === "a" ? spinWheelRef : { current: null }}
          onSpinComplete={handleSpinComplete}
          onExternalSpinPress={buffer === "a" ? handleExternalSpinPress : NOOP}
          onHubClaimPress={buffer === "a" ? handleHubClaim : NOOP}
          isSpinning={isSpinning}
          clearSpinInteraction={clearSpinInteraction}
          hubMode={buffer === "a" ? hubMode : "busy"}
          spinLocked={spinLocked}
          ringPhaseResetKey={ri}
          onBulbRingPhaseChange={listenBulb ? reel.onPrimaryBulbPhaseChange : undefined}
          sliceEraseMode={sliceEraseMode}
          isActiveWheel={isActive}
          gambleFlipActive={gambleFlipActive && isActive}
          spinArmEpoch={spinArmEpoch}
          onBanishSlice={(sliceIndex) => handleBanishSlice(ri, sliceIndex)}
        />
      );
    },
    [
      awaitingClaim,
      gambleFlipActive,
      spinArmEpoch,
      handleBanishSlice,
      handleExternalSpinPress,
      handleHubClaim,
      handleSpinComplete,
      isSpinning,
      pageHeight,
      reel.stripSpringing,
      reel.activeIndex,
      reel.nextIndex,
      reel.onPrimaryBulbPhaseChange,
      reel.stripScrolling,
      mountNextStripSlot,
      revealNextSlot,
      rounds,
      run,
      scrolling,
      sliceEraseMode,
      textSize,
      wheelInnerSize,
    ]
  );

  return (
    <View style={[styles.root, styles.flexFill, { backgroundColor: RUN_PAGE_BACKGROUND }]}>
      <View
        style={styles.flexFill}
        pointerEvents={reel.interactionLocked || isSpinning ? "none" : "auto"}
      >
        <View
          style={[styles.clip, { height: pageHeight }]}
          {...(Platform.OS === "web"
            ? {
                onWheel: (e: { nativeEvent?: { deltaY?: number }; deltaY?: number }) => {
                  const dy = e.nativeEvent?.deltaY ?? e.deltaY;
                  if (dy == null) return;
                  reel.pokeWebWheelScrollBlur(dy);
                  if (Math.abs(dy) > 4 && shouldDismissNoticeOnScroll()) {
                    dismissToast();
                  }
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
                collapsable={false}
                style={[
                  styles.slotRow,
                  { height: pageHeight, backgroundColor: RUN_PAGE_BACKGROUND },
                ]}
              >
                {renderStripBuffer("a")}
              </View>
              <View
                key="strip-buffer-b"
                collapsable={false}
                style={[
                  styles.slotRow,
                  { height: pageHeight, backgroundColor: RUN_PAGE_BACKGROUND },
                ]}
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
              { backgroundColor: "rgba(0,0,0,0.35)" },
              reel.motionScrimStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
}, (prev: RunWheelFeedProps, next: RunWheelFeedProps) =>
  prev.pageHeight === next.pageHeight &&
  runReelFeedKey(prev.run) === runReelFeedKey(next.run));

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexFill: { flex: 1 },
  clip: { overflow: "hidden", width: "100%", position: "relative" },
  reelScrimLayer: { zIndex: 2 },
  slotRow: { width: "100%" },
  slotRowCentered: { justifyContent: "center", alignItems: "center" },
  wheelSlotShell: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },
  wheelPad: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  wheelSlotErase: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Neo.neonCyan,
    borderStyle: "dashed",
  },
  wheelPadErase: {
    opacity: 1,
  },
  eraseBanner: {
    position: "absolute",
    top: 8,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Neo.neonCyan,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 10,
  },
  eraseBannerText: {
    fontSize: 15,
    color: Neo.ink,
    letterSpacing: 0.4,
  },
});
