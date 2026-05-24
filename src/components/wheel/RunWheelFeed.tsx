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
import { GestureDetector, type GestureType } from "react-native-gesture-handler";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { SpinWheelStage } from "../../../features/cash-spin/components/SpinWheelStage";
import {
  isCompactCashSpinWindow,
  stripVisualIntensityForDevice,
  WHEEL_FROST_INTENSITY_REDUCE_MOTION,
} from "../../../features/cash-spin/cashStripPerformance";
import { useReelStripEngine } from "../../../features/cash-spin/hooks/useReelStripEngine";
import { REEL_STRIP } from "../../../features/cash-spin/reelStripConstants";
import { useSpinFeedbackWash } from "../../hooks/useSpinFeedbackWash";
import { computeRunWheelStageDimensions } from "../../../lib/layout/runStageLayout";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
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
import type { RunState, SliceDefinition } from "../../schemas";
import { isBossWheelClaim } from "../../game/cycle/cycleTransition";
import {
  blocksReelAdvanceForTactics,
  deriveHubMode,
  deriveSpinLocked,
} from "../../game/tactics/wheelHubState";
import { buildGambleSlices, overlayGambleWheel } from "../../game/tactics/gambleWheel";
import { isWheelAtLaserMinimum, LASER_MIN_SLICE_COUNT } from "../../game/runState/laserSlice";
import { useRunWheelUi } from "../../hooks/useRunWheelUi";
import { useRunStore } from "../../stores/runStore";
import {
  shouldDismissNoticeOnScroll,
  showLaserBlockedNotice,
  showRunNotice,
} from "../../game/notices/runNotices";
import { useRunToastStore } from "../../stores/runToastStore";
import { sliceWheelCaptionForRun } from "../../utils/sliceMoneyDisplay";
import { runHapticImpact, runHapticNotification } from "../../utils/haptics";
import * as Haptics from "expo-haptics";
import type { SpinWheelItem } from "../../../wheel/types";
import type { BulbRingPhase } from "../../../features/cash-spin/bulbRingPhase";
import {
  bulbPhaseForFeedback,
  washFlashIntensity,
  isGainTier,
  isLossTier,
  type SpinFeedbackTier,
} from "../../game/spinFeedback";
import { spinTrace } from "../../dev/spinTrace";

type RunWheelFeedProps = {
  run: RunState;
  pageHeight: number;
  /** Bust memo when claim / boss-pending UI changes without a run key change. */
  reelUiKey: string;
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
  wheelInnerMax,
  stageWidth,
  stageHeight,
  textSize,
  textColor,
  wheelPadH,
  spinWheelRef,
  onSpinComplete,
  onSpinSettled,
  onExternalSpinPress,
  onHubClaimPress,
  hubMode,
  spinLocked,
  ringPhaseResetKey,
  onBulbRingPhaseChange,
  bulbRingPhase,
  spinFeedbackTier = null,
  scrollGrainOverlay,
  sliceEraseMode,
  isActiveWheel,
  gambleFlipActive,
  spinArmEpoch,
  onBanishSlice,
  isSpinning,
  clearSpinInteraction,
  onSpinInterrupted,
  stripPanGesture,
}: {
  roundIndex: number;
  pageHeight: number;
  run: RunState;
  wheelInnerSize: number;
  wheelInnerMax: number;
  stageWidth: number;
  stageHeight: number;
  textSize: number;
  textColor: string;
  wheelPadH: number;
  spinWheelRef: React.RefObject<SpinWheelRef | null>;
  onSpinComplete: (roundIndex: number, item: { id: string; label?: string }) => void;
  onSpinSettled?: () => void;
  onExternalSpinPress: () => void;
  onHubClaimPress: () => void;
  hubMode: "spin" | "claim" | "busy";
  spinLocked: boolean;
  ringPhaseResetKey: number;
  onBulbRingPhaseChange?: (phase: BulbRingPhase) => void;
  bulbRingPhase?: BulbRingPhase;
  spinFeedbackTier?: SpinFeedbackTier | null;
  scrollGrainOverlay?: React.ReactNode;
  sliceEraseMode: boolean;
  isActiveWheel: boolean;
  gambleFlipActive: boolean;
  spinArmEpoch: number;
  onBanishSlice: (sliceIndex: number) => void;
  isSpinning: boolean;
  clearSpinInteraction: () => void;
  onSpinInterrupted?: () => void;
  stripPanGesture?: GestureType;
}) {
  const baseWheel = run.wheels[roundIndex];
  const wheel = useMemo(() => {
    if (baseWheel == null || !gambleFlipActive || !isActiveWheel) return baseWheel;
    return overlayGambleWheel(baseWheel);
  }, [baseWheel, gambleFlipActive, isActiveWheel]);
  const sliceIconScale =
    gambleFlipActive && isActiveWheel && (wheel?.slices.length ?? 0) === 2 ? 1.48 : 1;
  const [previewSliceIndex, setPreviewSliceIndex] = useState<number | null>(null);
  const eraseArmed = sliceEraseMode && isActiveWheel && !spinLocked && !isSpinning;
  const atLaserMinimum = wheel != null && isWheelAtLaserMinimum(wheel.slices.length);

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
        <View style={[styles.eraseBanner, atLaserMinimum && styles.eraseBannerBlocked]} pointerEvents="none">
          <MaterialCommunityIcons
            name={atLaserMinimum ? "ray-start-end" : "eraser"}
            size={18}
            color={Neo.ink}
          />
          <Text style={[styles.eraseBannerText, { fontFamily: FONT_BEBAS_NEUE }]}>
            {atLaserMinimum
              ? `Min ${LASER_MIN_SLICE_COUNT} wedges — cannot remove`
              : "Tap a wedge to laser"}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.wheelSlotShell,
          { minHeight: stageHeight },
          eraseArmed && styles.wheelSlotErase,
        ]}
      >
        <View
          style={[
            styles.wheelPad,
            { width: stageWidth, minHeight: stageHeight, paddingHorizontal: wheelPadH },
            eraseArmed && styles.wheelPadErase,
          ]}
        >
          <SpinWheelStage
            data={wheelData}
            wheelInnerSize={wheelInnerSize}
            wheelInnerMax={wheelInnerMax}
            textSize={textSize}
            wheelPhysics={wheelPhysics}
            segmentColors={colors}
            bulbRingPalette={bulbRingPalette}
            bulbRingPhase={bulbRingPhase}
            spinFeedbackTier={spinFeedbackTier}
            textColor={textColor}
            ringPhaseResetKey={ringPhaseResetKey}
            spinLocked={spinLocked}
            spinWheelRef={spinWheelRef}
            externalSpinControl
            hubMode={hubMode}
            onHubClaimPress={onHubClaimPress}
            sliceLabelMode="icons"
            sliceIconScale={sliceIconScale}
            hubAnimSubtle
            onExternalSpinPress={onExternalSpinPress}
            onBulbRingPhaseChange={onBulbRingPhaseChange}
            onSpinComplete={(item) => onSpinComplete(roundIndex, item)}
            onSpinSettled={onSpinSettled}
            scrollGrainOverlay={scrollGrainOverlay}
            spinArmEpoch={isActiveWheel ? spinArmEpoch : 0}
            onSpinInterrupted={isActiveWheel ? onSpinInterrupted : undefined}
            stripPanGesture={isActiveWheel ? stripPanGesture : undefined}
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

export const RunWheelFeed = memo(function RunWheelFeed({
  run,
  pageHeight,
  reelUiKey: _reelUiKey,
}: RunWheelFeedProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const chrome = useRunChromeMetrics();
  const {
    awaitingClaim,
    isSpinning,
    gambleFlipActive,
    sliceEraseMode,
    lastResultLabel,
    bossCyclePhase,
    spinFeedbackTier,
    washFlashEpoch,
    washFlashTier,
  } = useRunWheelUi();
  const bossCycleUiActive = bossCyclePhase !== "none";
  const stageFeedbackTier = washFlashTier ?? spinFeedbackTier;
  const { stageBgStyle, overlayStyle, washColor, active: washActive } = useSpinFeedbackWash(
    washFlashEpoch,
    washFlashTier
  );
  const [spinArmEpoch, setSpinArmEpoch] = useState(0);
  const prevWheelIndexRef = useRef(run.wheelIndex);
  const armedSpinRef = useRef<{ wheelIndex: number; sliceIndex: number } | null>(null);
  const spinGuardEpochRef = useRef(0);
  const spinFinishEpochRef = useRef(-1);
  const spinCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissToast = useRunToastStore((s) => s.dismiss);
  const toastVisible = useRunToastStore((s) => s.toast != null);
  const clearSpinInteraction = useCallback(
    () => useRunStore.getState().clearSpinInteraction(),
    []
  );

  const rounds = useRunReelRounds(run, awaitingClaim, lastResultLabel, gambleFlipActive);
  const spinWheelRef = useRef<SpinWheelRef>(null);
  const prevIsSpinningRef = useRef(false);

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

  const useLargeWheel = chrome.largeUi;
  const stageDims = useMemo(
    () => computeRunWheelStageDimensions(winW, pageHeight, useLargeWheel),
    [winW, pageHeight, useLargeWheel]
  );
  const { wheelInnerSize, wheelInnerMax, stageWidth, stageHeight, textSize } = stageDims;
  const wheelPadH = useLargeWheel ? 2 : 6;
  const textColor = Neo.wheelSliceLabel;

  const reelEngineRef = useRef<ReturnType<typeof useReelStripEngine> | null>(null);

  const onStripSettled = useCallback(() => {
    useRunStore.getState().healRunUi();
  }, []);

  const onReelAdvanced = useCallback(() => {
    const store = useRunStore.getState();
    store.clearSpinInteraction();
    reelEngineRef.current?.setSpinningSafe(false);
    store.healRunUi();
  }, []);

  const onClaimed = useCallback((roundIndex: number): boolean => {
    const store = useRunStore.getState();
    const current = store.run;
    if (current == null || roundIndex !== current.wheelIndex) return false;
    if (!store.ui.awaitingClaim) return false;
    if (
      blocksReelAdvanceForTactics(
        current,
        store.ui.awaitingClaim,
        store.ui.isSpinning,
        store.ui.gambleFlipActive,
        store.preSpinSnapshot != null
      )
    ) {
      return false;
    }
    return store.claimAndAdvance();
  }, []);

  const handleBanishSlice = useCallback((wheelIndex: number, sliceIndex: number) => {
    const result = useRunStore.getState().banishSliceAt(wheelIndex, sliceIndex);
    if (result.ok) {
      runHapticNotification(Haptics.NotificationFeedbackType.Success);
      showRunNotice({
        type: "success",
        title: "Wedge removed",
        body: "One fewer slice on this wheel",
        icon: "ray-start",
      });
      return;
    }
    showLaserBlockedNotice(result.reason);
  }, []);

  const shouldAdvanceStripAfterClaim = useCallback((roundIndex: number) => {
    const store = useRunStore.getState();
    if (store.ui.bossCyclePhase !== "none") return false;
    const current = store.run;
    if (current != null && isBossWheelClaim(current, roundIndex)) return false;
    return true;
  }, []);

  const armedSpinSession = useRunStore((s) => s.armedSpinSession);
  const preSpinSnapshot = useRunStore((s) => s.preSpinSnapshot);

  const tacticBlocksReel = useMemo(
    () =>
      blocksReelAdvanceForTactics(
        run,
        awaitingClaim,
        isSpinning,
        gambleFlipActive,
        preSpinSnapshot != null
      ),
    [awaitingClaim, gambleFlipActive, isSpinning, preSpinSnapshot, run]
  );

  const reel = useReelStripEngine({
    pageHeight,
    rounds,
    initialActiveIndex: run.wheelIndex,
    bootRunId: `${run.runId}:${run.floor}`,
    onClaimed,
    shouldAdvanceStripAfterClaim,
    onPrepareAdvance: () => useRunStore.getState().commitWheelLayout(),
    onReelAdvanced,
    onStripSettled,
    stripVisualIntensity,
    wheelFrostVisualIntensity,
    panEnabled: !isSpinning && armedSpinSession == null && !tacticBlocksReel,
  });
  reelEngineRef.current = reel;

  const lastWashBulbEpochRef = useRef(0);
  const [washBulbPhase, setWashBulbPhase] = useState<BulbRingPhase | null>(null);

  useEffect(() => {
    if (washFlashEpoch <= lastWashBulbEpochRef.current || washFlashTier == null) return;
    lastWashBulbEpochRef.current = washFlashEpoch;
    const phase = bulbPhaseForFeedback(washFlashTier);
    setWashBulbPhase(phase);
    const { peak } = washFlashIntensity(washFlashTier);
    const holdMs =
      phase === "jackpot"
        ? 1100
        : Math.round(480 + peak * 520);
    const t = setTimeout(() => setWashBulbPhase(null), holdMs);
    return () => clearTimeout(t);
  }, [washFlashEpoch, washFlashTier]);

  const bulbRingPhase = useMemo((): BulbRingPhase => {
    if (isSpinning) return "spinning";
    if (washBulbPhase != null) return washBulbPhase;
    if (spinFeedbackTier != null) return bulbPhaseForFeedback(spinFeedbackTier);
    return "idle";
  }, [isSpinning, washBulbPhase, spinFeedbackTier]);

  useEffect(() => {
    reelEngineRef.current?.setSpinningSafe(isSpinning);
  }, [isSpinning]);

  const handleHubClaim = useCallback(() => {
    const store = useRunStore.getState();
    const { ui, run: current } = store;
    if (ui.isSpinning || ui.gambleFlipActive) return;
    if (
      current != null &&
      blocksReelAdvanceForTactics(
        current,
        ui.awaitingClaim,
        ui.isSpinning,
        ui.gambleFlipActive,
        store.preSpinSnapshot != null
      )
    ) {
      return;
    }
    if (current != null && ui.awaitingClaim) {
      store.claimAndAdvance();
      return;
    }
    reel.requestAdvance();
  }, [reel]);

  const finishSpinRef = useRef<() => void>(() => {});

  const clearSpinCompleteTimer = useCallback(() => {
    if (spinCompleteTimerRef.current != null) {
      clearTimeout(spinCompleteTimerRef.current);
      spinCompleteTimerRef.current = null;
    }
  }, []);

  const scheduleSpinComplete = useCallback(
    (delayMs: number) => {
      clearSpinCompleteTimer();
      spinCompleteTimerRef.current = setTimeout(() => {
        spinCompleteTimerRef.current = null;
        finishSpinRef.current();
      }, delayMs);
    },
    [clearSpinCompleteTimer]
  );

  const finishSpinFromStore = useCallback(() => {
    clearSpinCompleteTimer();

    const store = useRunStore.getState();
    if (!store.ui.isSpinning && store.armedSpinSession == null) return;
    if (spinFinishEpochRef.current === store.spinCommitEpoch) return;
    spinFinishEpochRef.current = store.spinCommitEpoch;

    spinTrace("finish", {
      wheelIndex: store.run?.wheelIndex,
      armed: store.armedSpinSession?.sliceId ?? null,
    });
    const committed = store.resolveSpinInteraction();
    armedSpinRef.current = null;
    reelEngineRef.current?.setSpinningSafe(false);
    const afterResolve = useRunStore.getState();
    spinTrace("resolved", {
      committed,
      isSpinning: afterResolve.ui.isSpinning,
      awaitingClaim: afterResolve.ui.awaitingClaim,
      lastSliceId: afterResolve.ui.lastSliceId,
      pendingRebuild: afterResolve.run?.pendingWheelRebuild,
    });

    if (afterResolve.run?.phase === "active") {
      afterResolve.healRunUi();
    }

    if (committed && afterResolve.run?.pendingWheelRebuild) {
      afterResolve.scheduleWheelLayoutCommit();
    }

    if (!committed) return;

    const tier =
      useRunStore.getState().ui.washFlashTier ??
      useRunStore.getState().ui.spinFeedbackTier;
    if (tier != null && isLossTier(tier)) {
      runHapticNotification(Haptics.NotificationFeedbackType.Error);
      if (tier === "loss_wipe" || tier === "loss_large") {
        runHapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } else if (tier === "gain_jackpot" || tier === "gain_large") {
      runHapticNotification(Haptics.NotificationFeedbackType.Success);
      runHapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (tier != null && isGainTier(tier)) {
      runHapticNotification(Haptics.NotificationFeedbackType.Success);
    } else {
      runHapticImpact(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [clearSpinCompleteTimer]);

  finishSpinRef.current = finishSpinFromStore;

  const handleExternalSpinPress = useCallback(() => {
    clearSpinCompleteTimer();
    spinFinishEpochRef.current = -1;

    const store = useRunStore.getState();
    let current = store.run;
    if (current == null) return;
    if (store.ui.isSpinning || store.armedSpinSession != null) return;

    const ri = current.wheelIndex;
    const wheel = current.wheels[ri];
    const flipActive = store.ui.gambleFlipActive;
    if (wheel == null || !RunManager.canSpin(current, ri)) return;
    if (store.ui.awaitingClaim && !flipActive) return;

    const ctx = buildResolveContext(current, wheel, ri);
    const resolved = flipActive
      ? resolveSlice(buildGambleSlices(), ctx)
      : resolveSlice(wheel.slices, ctx);
    const { index, slice } = resolved;

    store.armSpinSession({
      wheelIndex: ri,
      sliceId: slice.id,
      sliceIndex: index,
      slice,
      ...(flipActive ? { isGambleFlip: true as const } : {}),
    });

    const reelApi = reelEngineRef.current;
    if (reelApi != null && reelApi.activeIndex !== ri) {
      reelApi.snapToIndex(ri);
    }

    const sliceCount = wheel.slices.length;
    const targetIndex = Math.max(0, Math.min(index, sliceCount - 1));
    armedSpinRef.current = { wheelIndex: ri, sliceIndex: targetIndex };

    const physics = physicsForProfile(wheel.definition.physicsProfileId ?? "default");
    scheduleSpinComplete(spinSafetyTimeoutMs(physics) + 800);
    setSpinArmEpoch((e) => e + 1);
    store.setSpinning(true);
    runHapticImpact(Haptics.ImpactFeedbackStyle.Medium);

    spinTrace("press", {
      wheelIndex: ri,
      targetIndex,
      sliceCount,
      sliceId: slice.id,
      hasRef: spinWheelRef.current != null,
    });

    const drive = () => {
      if (spinWheelRef.current != null) {
        spinWheelRef.current.spinToIndex(targetIndex);
      } else {
        spinTrace("spin_ref_missing");
      }
    };
    if (spinWheelRef.current != null) {
      drive();
    } else {
      requestAnimationFrame(drive);
    }
  }, [clearSpinCompleteTimer, scheduleSpinComplete]);

  /** External spins commit via `onSpinSettled` only; kept for RunWheelSlot API / Fast Refresh. */
  const handleSpinComplete = useCallback(
    (_roundIndex: number, _item: { id: string; label?: string }) => {},
    []
  );

  const handleSpinInterrupted = useCallback(() => {
    /* Remount during wedge rebuild must not relaunch spin (was freezing the app). */
  }, []);

  useEffect(() => {
    prevIsSpinningRef.current = isSpinning;
  }, [isSpinning]);

  useEffect(() => {
    const store = useRunStore.getState();
    if (!store.ui.isSpinning) return;
    if (store.armedSpinSession != null) return;
    store.clearSpinInteraction();
    store.healRunUi();
    reelEngineRef.current?.setSpinningSafe(false);
  }, [run.runId, run.wheelIndex]);

  useEffect(
    () => () => {
      clearSpinCompleteTimer();
    },
    [clearSpinCompleteTimer]
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
    const epoch = ++spinGuardEpochRef.current;
    const t = setTimeout(() => {
      if (spinGuardEpochRef.current !== epoch) return;
      const state = useRunStore.getState();
      if (!state.ui.isSpinning) return;
      if (state.armedSpinSession == null) {
        state.clearSpinInteraction();
        reelEngineRef.current?.setSpinningSafe(false);
        return;
      }
      finishSpinRef.current();
    }, spinGuardMs);
    return () => clearTimeout(t);
  }, [isSpinning, spinGuardMs]);

  useEffect(() => {
    if (prevWheelIndexRef.current === run.wheelIndex) return;
    prevWheelIndexRef.current = run.wheelIndex;
    clearSpinCompleteTimer();
    const store = useRunStore.getState();
    store.clearArmedSpinSession();
    armedSpinRef.current = null;
    if (store.run?.pendingWheelRebuild) {
      store.scheduleWheelLayoutCommit();
    }
    store.clearSpinInteraction();
    store.healRunUi();
    spinTrace("wheel_enter", { wheelIndex: run.wheelIndex });
    const reelApi = reelEngineRef.current;
    reelApi?.setSpinningSafe(false);
    if (reelApi != null && reelApi.activeIndex !== run.wheelIndex) {
      reelApi.snapToIndex(run.wheelIndex);
    }
  }, [clearSpinCompleteTimer, run.wheelIndex]);

  const prevBossPhaseRef = useRef(bossCyclePhase);
  useEffect(() => {
    const prev = prevBossPhaseRef.current;
    prevBossPhaseRef.current = bossCyclePhase;
    if (prev === "reward" && bossCyclePhase === "none") {
      const reelApi = reelEngineRef.current;
      reelApi?.snapToIndex(run.wheelIndex);
      reelApi?.setSpinningSafe(false);
      useRunStore.getState().clearSpinInteraction();
      useRunStore.getState().healRunUi();
    }
  }, [bossCyclePhase, run.wheelIndex]);

  useEffect(() => {
    if (bossCycleUiActive) return;
    if (reel.activeIndex === run.wheelIndex) return;
    const store = useRunStore.getState();
    const reelApi = reelEngineRef.current;
    reelApi?.snapToIndex(run.wheelIndex);
    reelApi?.setSpinningSafe(false);
    store.clearSpinInteraction();
    store.healRunUi();
  }, [bossCycleUiActive, reel.activeIndex, run.wheelIndex]);

  useEffect(() => {
    const store = useRunStore.getState();
    store.clearSpinInteraction();
    store.healRunUi();
  }, [run.runId, run.floor]);

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

  const wasSpinningRef = useRef(false);
  useEffect(() => {
    if (isSpinning && !wasSpinningRef.current) {
      dismissToast();
    }
    wasSpinningRef.current = isSpinning;
  }, [dismissToast, isSpinning]);

  const stripNextIndex = reel.nextIndex;

  const mountNextStripSlot =
    stripNextIndex != null && (scrolling || revealNextSlot || reel.stripSpringing);

  const renderStripBuffer = useCallback(
    (buffer: "a" | "b") => {
      const roundIndex = buffer === "a" ? reel.activeIndex : stripNextIndex;
      if (buffer === "b" && (roundIndex == null || !mountNextStripSlot)) {
        return <View style={[styles.slotRow, { height: pageHeight }]} />;
      }
      const ri = roundIndex as number;
      const slotRun = run;
      const round = rounds[ri];

      const isReelActive = ri === run.wheelIndex && ri === reel.activeIndex;
      const hubMode = deriveHubMode({
        run,
        roundIndex: ri,
        isSpinning,
        awaitingClaim,
        gambleFlipActive,
        isReelActive,
        round,
      });
      const spinLocked = deriveSpinLocked(hubMode, isSpinning);
      return (
        <RunWheelSlot
          key={buffer === "a" ? "reel-slot-a" : "reel-slot-b"}
          roundIndex={ri}
          pageHeight={pageHeight}
          run={slotRun}
          wheelInnerSize={wheelInnerSize}
          wheelInnerMax={wheelInnerMax}
          stageWidth={stageWidth}
          stageHeight={stageHeight}
          textSize={textSize}
          textColor={textColor}
          wheelPadH={wheelPadH}
          spinWheelRef={buffer === "a" ? spinWheelRef : { current: null }}
          onSpinComplete={handleSpinComplete}
          onSpinSettled={buffer === "a" ? finishSpinFromStore : undefined}
          onExternalSpinPress={buffer === "a" ? handleExternalSpinPress : NOOP}
          onHubClaimPress={buffer === "a" ? handleHubClaim : NOOP}
          isSpinning={isSpinning}
          clearSpinInteraction={clearSpinInteraction}
          hubMode={buffer === "a" ? hubMode : "busy"}
          spinLocked={spinLocked}
          ringPhaseResetKey={ri}
          bulbRingPhase={isReelActive ? bulbRingPhase : "idle"}
          spinFeedbackTier={isReelActive ? stageFeedbackTier : null}
          sliceEraseMode={sliceEraseMode}
          isActiveWheel={isReelActive}
          gambleFlipActive={gambleFlipActive && isReelActive}
          spinArmEpoch={spinArmEpoch}
          stripPanGesture={reel.panGesture}
          onBanishSlice={(sliceIndex) => handleBanishSlice(ri, sliceIndex)}
          onSpinInterrupted={buffer === "a" ? handleSpinInterrupted : undefined}
        />
      );
    },
    [
      awaitingClaim,
      gambleFlipActive,
      spinArmEpoch,
      finishSpinFromStore,
      handleSpinComplete,
      handleSpinInterrupted,
      handleBanishSlice,
      handleExternalSpinPress,
      handleHubClaim,
      isSpinning,
      tacticBlocksReel,
      pageHeight,
      reel.stripSpringing,
      reel.activeIndex,
      reel.stripScrolling,
      mountNextStripSlot,
      revealNextSlot,
      rounds,
      run,
      scrolling,
      sliceEraseMode,
      stripNextIndex,
      stageFeedbackTier,
      textSize,
      stageHeight,
      stageWidth,
      wheelInnerMax,
      wheelInnerSize,
      wheelPadH,
    ]
  );

  return (
    <Animated.View style={[styles.root, styles.flexFill, stageBgStyle]}>
      <View
        style={styles.flexFill}
        pointerEvents="box-none"
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
              <Animated.View
                key="strip-buffer-a"
                collapsable={false}
                style={[styles.slotRow, { height: pageHeight }, stageBgStyle]}
              >
                {renderStripBuffer("a")}
              </Animated.View>
              <Animated.View
                key="strip-buffer-b"
                collapsable={false}
                style={[styles.slotRow, { height: pageHeight }, stageBgStyle]}
              >
                {renderStripBuffer("b")}
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {washActive ? (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                styles.stageWashLayer,
                { backgroundColor: washColor },
                overlayStyle,
              ]}
            />
          ) : null}

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
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexFill: { flex: 1 },
  clip: { overflow: "hidden", width: "100%", position: "relative" },
  stageWashLayer: { zIndex: 1 },
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
    justifyContent: "center",
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
  eraseBannerBlocked: {
    backgroundColor: "#FDE68A",
    borderColor: "#B45309",
  },
  eraseBannerText: {
    fontSize: 15,
    color: Neo.ink,
    letterSpacing: 0.4,
  },
});
