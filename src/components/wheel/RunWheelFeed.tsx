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
import { WHEEL_STAGES } from "../../game/loop";
import {
  computeSpinWheelTextSize,
  computeWheelInnerSize,
} from "../../../lib/layout/wheelFrame";
import { CASH_SPIN_WHEEL_PROFILE } from "../../../lib/wheel/profiles";
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
import { useRunStore } from "../../stores/runStore";
import { useRunToastStore } from "../../stores/runToastStore";
import { sliceWheelCaptionForRun } from "../../utils/sliceMoneyDisplay";
import type { SpinWheelItem } from "../../../wheel/types";

type RunWheelFeedProps = {
  run: RunState;
  pageHeight: number;
};

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
  onBanishSlice,
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
  onBanishSlice: (sliceIndex: number) => void;
}) {
  const wheel = run.wheels[roundIndex];
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const [previewSliceIndex, setPreviewSliceIndex] = useState<number | null>(null);
  const eraseArmed = sliceEraseMode && isActiveWheel && !spinLocked && !isSpinning;

  useEffect(() => {
    if (isSpinning) setPreviewSliceIndex(null);
  }, [isSpinning]);

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
  }, [run, roundIndex, wheel]);

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
            Tap a wedge to banish
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
            slicePressEnabled={!spinLocked && !isSpinning}
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

export function RunWheelFeed({ run, pageHeight }: RunWheelFeedProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const awaitingClaim = useRunStore((s) => s.ui.awaitingClaim);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const sliceEraseMode = useRunStore((s) => s.ui.sliceEraseMode);
  const applySpinResult = useRunStore((s) => s.applySpinResult);
  const claimAndAdvance = useRunStore((s) => s.claimAndAdvance);
  const commitWheelLayout = useRunStore((s) => s.commitWheelLayout);
  const setSpinning = useRunStore((s) => s.setSpinning);
  const banishSliceAt = useRunStore((s) => s.banishSliceAt);
  const lastResultLabel = useRunStore((s) => s.ui.lastResultLabel);
  const showToast = useRunToastStore((s) => s.show);

  const rounds = useRunReelRounds(run, awaitingClaim, lastResultLabel);
  const spinWheelRef = useRef<SpinWheelRef>(null);
  const pendingSliceRef = useRef<{
    wheelIndex: number;
    sliceId: string;
    sliceIndex: number;
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

  const onClaimed = useCallback(
    (roundIndex: number) => {
      const current = useRunStore.getState().run;
      if (current == null || roundIndex !== current.wheelIndex) return;
      claimAndAdvance();
    },
    [claimAndAdvance]
  );

  const handleBanishSlice = useCallback(
    (wheelIndex: number, sliceIndex: number) => {
      const result = banishSliceAt(wheelIndex, sliceIndex);
      if (result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast({ type: "success", title: "Wedge banished", icon: "eraser" });
        return;
      }
      showToast({ type: "info", title: result.reason, icon: "info" });
    },
    [banishSliceAt, showToast]
  );

  const reel = useReelStripEngine({
    pageHeight,
    rounds,
    initialActiveIndex: run.wheelIndex,
    bootRunId: run.runId,
    onClaimed,
    onPrepareAdvance: commitWheelLayout,
    stripVisualIntensity,
    wheelFrostVisualIntensity,
  });

  const slotTint = useCallback((wheelIndex: number) => {
    const r = run.wheels[wheelIndex]?.definition.role ?? "base";
    return WHEEL_STAGES[r]?.pageTint ?? "#141018";
  }, [run.wheels]);

  const pageBgCurrent = slotTint(reel.activeIndex);
  const pageBgNext =
    reel.nextIndex != null ? slotTint(reel.nextIndex) : pageBgCurrent;

  const handleHubClaim = useCallback(() => {
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
    if (wheel == null || !RunManager.canSpin(current, ri) || isSpinning || awaitingClaim) return;

    const ctx = buildResolveContext(current, wheel);
    const { index, slice } = resolveSlice(wheel.slices, ctx);
    pendingSliceRef.current = { wheelIndex: ri, sliceId: slice.id, sliceIndex: index };
    setSpinning(true);
    reel.setSpinningSafe(true);
    spinWheelRef.current?.spinToIndex(index);
  }, [awaitingClaim, isSpinning, reel, setSpinning]);

  const handleSpinComplete = useCallback(
    (roundIndex: number, item: { id: string; label?: string }) => {
      setSpinning(false);
      reel.setSpinningSafe(false);
      const current = useRunStore.getState().run;
      if (current == null || roundIndex !== current.wheelIndex) return;
      const wheel = current.wheels[roundIndex];
      const pending = pendingSliceRef.current;
      // Resolved slice from DB odds is authoritative — not the animation wedge id.
      const slice =
        pending?.wheelIndex === roundIndex
          ? wheel?.slices[pending.sliceIndex] ??
            wheel?.slices.find((s) => s.id === pending.sliceId)
          : wheel?.slices.find((s) => s.id === item.id);
      pendingSliceRef.current = null;
      if (slice == null) {
        setSpinning(false);
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      applySpinResult(roundIndex, slice.id);
    },
    [applySpinResult, reel, setSpinning]
  );

  useEffect(() => {
    if (!isSpinning) return;
    const t = setTimeout(() => {
      const { ui } = useRunStore.getState();
      if (ui.isSpinning) {
        setSpinning(false);
        reel.setSpinningSafe(false);
      }
    }, 14000);
    return () => clearTimeout(t);
  }, [isSpinning, reel, setSpinning]);

  const [revealNextSlot, setRevealNextSlot] = useState(false);
  const scrolling = reel.stripScrollProgress > 0.02;

  useEffect(() => {
    if (!scrolling) {
      setRevealNextSlot(false);
      return;
    }
    const t = setTimeout(() => setRevealNextSlot(true), 150);
    return () => clearTimeout(t);
  }, [scrolling, reel.stripScrollProgress]);

  const renderStripBuffer = useCallback(
    (buffer: "a" | "b") => {
      const roundIndex = buffer === "a" ? reel.activeIndex : reel.nextIndex;
      if (buffer === "b" && roundIndex == null) {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }
      const ri = roundIndex as number;
      const round = rounds[ri];

      if (buffer === "b" && scrolling && !revealNextSlot) {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }

      const isActive = ri === reel.activeIndex;
      const slotWheel = run.wheels[ri];
      const hubMode: "spin" | "claim" | "busy" =
        !isActive || round == null
          ? "busy"
          : awaitingClaim || round.status === "won"
            ? "claim"
            : isSpinning
              ? "busy"
              : round.status === "ready"
                ? "spin"
                : "busy";
      const spinLocked = hubMode !== "claim" && (hubMode !== "spin" || isSpinning);
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
          onExternalSpinPress={buffer === "a" ? handleExternalSpinPress : () => {}}
          onHubClaimPress={buffer === "a" ? handleHubClaim : () => {}}
          hubMode={buffer === "a" ? hubMode : "busy"}
          spinLocked={spinLocked}
          ringPhaseResetKey={ri}
          onBulbRingPhaseChange={listenBulb ? reel.onPrimaryBulbPhaseChange : undefined}
          sliceEraseMode={sliceEraseMode}
          isActiveWheel={isActive}
          onBanishSlice={(sliceIndex) => handleBanishSlice(ri, sliceIndex)}
        />
      );
    },
    [
      awaitingClaim,
      handleBanishSlice,
      handleExternalSpinPress,
      handleHubClaim,
      handleSpinComplete,
      isSpinning,
      pageHeight,
      reel.activeIndex,
      reel.nextIndex,
      reel.onPrimaryBulbPhaseChange,
      reel.stripScrollProgress,
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
    <View style={[styles.root, styles.flexFill, { backgroundColor: pageBgCurrent }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: pageBgNext, zIndex: 0 },
          reel.stripPageBlendStyle,
        ]}
      />
      <View
        style={[styles.flexFill, { zIndex: 1 }]}
        pointerEvents={reel.interactionLocked ? "none" : "auto"}
      >
        <View
          style={[styles.clip, { height: pageHeight }]}
          {...(Platform.OS === "web"
            ? {
                onWheel: (e: { nativeEvent?: { deltaY?: number }; deltaY?: number }) => {
                  const dy = e.nativeEvent?.deltaY ?? e.deltaY;
                  if (dy != null) reel.pokeWebWheelScrollBlur(dy);
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
                  { height: pageHeight, backgroundColor: slotTint(reel.activeIndex) },
                ]}
              >
                {renderStripBuffer("a")}
              </View>
              <View
                key="strip-buffer-b"
                collapsable={false}
                style={[
                  styles.slotRow,
                  {
                    height: pageHeight,
                    backgroundColor:
                      reel.nextIndex != null ? slotTint(reel.nextIndex) : slotTint(reel.activeIndex),
                  },
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
}

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
