import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
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
import { Neo, neoCardStyle, neoSubtitleOnDark, neoTitleOnDark } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { SpinWheelRef } from "../../../wheel/types";
import { useRunReelRounds } from "../../hooks/useRunReelRounds";
import { buildResolveContext } from "../../hooks/useWheelModifiers";
import { resolveSlice } from "../../systems/ProbabilityResolver";
import { WHEEL_DATABASE_REVISION } from "../../game/wheels/database/wheelDatabase";
import { normalizeRunState } from "../../game/runState";
import { RunManager } from "../../systems/RunManager";
import { rebuildWheelsFromDatabase } from "../../systems/WheelSystem";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";

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

function LockedWheelTeaser({
  pageHeight,
  role,
  floor,
  stage,
}: {
  pageHeight: number;
  role: import("../../schemas").WheelRole;
  floor: number;
  stage: (typeof WHEEL_STAGES)[import("../../schemas").WheelRole];
}) {
  const meta = stage;
  return (
    <View style={[styles.teaserPage, { height: pageHeight }]}>
      <View style={[neoCardStyle(360), styles.teaserCard]}>
        <MaterialIcons name="keyboard-double-arrow-up" size={36} color={Neo.neonYellow} />
        <MaterialIcons name={meta.icon as never} size={40} color={meta.accent} />
        <Text style={[neoTitleOnDark(20), styles.teaserTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
          {meta.label}
        </Text>
        <Text style={neoSubtitleOnDark(13)}>{meta.vibe}</Text>
        <Text style={neoSubtitleOnDark(12)}>F{floor} · claim previous first</Text>
      </View>
    </View>
  );
}

function RunWheelSlot({
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
}) {
  const wheel = run.wheels[roundIndex];
  if (wheel == null) return <View style={{ height: pageHeight }} />;

  const wheelPhysics = useMemo(
    () => physicsForProfile(wheel.definition.physicsProfileId),
    [wheel.definition.physicsProfileId]
  );

  const colors = useMemo(
    () => wheel.slices.map((_, i) => Neo.segmentColors[i % Neo.segmentColors.length]!),
    [wheel.slices.length]
  );

  return (
    <View style={[styles.slotRow, styles.slotRowCentered, { height: pageHeight }]}>
      <View style={styles.wheelSlotShell}>
        <View style={styles.wheelPad}>
          <SpinWheelStage
            data={wheel.spinItems}
            wheelInnerSize={wheelInnerSize}
            textSize={textSize}
            wheelPhysics={wheelPhysics}
            segmentColors={colors}
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
          />
        </View>
      </View>
    </View>
  );
}

export function RunWheelFeed({ run, pageHeight }: RunWheelFeedProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const awaitingClaim = useRunStore((s) => s.ui.awaitingClaim);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const applySpinResult = useRunStore((s) => s.applySpinResult);
  const claimAndAdvance = useRunStore((s) => s.claimAndAdvance);
  const commitWheelLayout = useRunStore((s) => s.commitWheelLayout);
  const setSpinning = useRunStore((s) => s.setSpinning);
  const lastResultLabel = useRunStore((s) => s.ui.lastResultLabel);

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
    current = rebuildWheelsFromDatabase(
      normalizeRunState({ ...current, wheelDbRevision: WHEEL_DATABASE_REVISION })
    );
    useRunStore.setState({ run: current });

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

  const renderStripBuffer = useCallback(
    (buffer: "a" | "b") => {
      const roundIndex = buffer === "a" ? reel.activeIndex : reel.nextIndex;
      if (buffer === "b" && roundIndex == null) {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }
      const ri = roundIndex as number;
      const round = rounds[ri];
      const nextWheel = run.wheels[ri];

      if (round?.status === "locked") {
        const nextRole = nextWheel?.definition.role ?? "base";
        const nextStage = WHEEL_STAGES[nextRole];
        return (
          <LockedWheelTeaser pageHeight={pageHeight} role={nextRole} floor={run.floor} stage={nextStage} />
        );
      }

      if (round?.status === "claimed") {
        const label = round.prize?.label ?? "Claimed";
        return (
          <View style={[styles.slotRow, styles.slotRowCentered, { height: pageHeight }]}>
            <View style={[neoCardStyle(340), styles.claimedCard]}>
              <MaterialIcons name="verified" size={28} color={Neo.neonCyan} />
              <Text style={[neoTitleOnDark(20), { fontFamily: FONT_BEBAS_NEUE }]}>{label}</Text>
              <Text style={neoSubtitleOnDark(13)}>Wheel {ri + 1} cleared</Text>
            </View>
          </View>
        );
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
        />
      );
    },
    [
      awaitingClaim,
      handleExternalSpinPress,
      handleHubClaim,
      handleSpinComplete,
      isSpinning,
      pageHeight,
      reel.activeIndex,
      reel.nextIndex,
      reel.onPrimaryBulbPhaseChange,
      rounds,
      run,
      slotTint,
      textSize,
      wheelFrostVisualIntensity,
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
  teaserPage: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  teaserCard: {
    backgroundColor: Neo.surfaceDark,
    alignItems: "center",
    gap: 8,
    borderColor: Neo.neonYellow,
  },
  teaserTitle: { textAlign: "center" },
  claimedCard: {
    backgroundColor: Neo.surfaceDark,
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
  },
});
