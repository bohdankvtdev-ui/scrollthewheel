import { useCallback, useMemo } from "react";
import { FLOOR_WHEEL_COUNT, getArchetypeForWheelIndex } from "../game/wheels";
import {
  advanceToNextWheel,
  canSpinWheel,
  createRunState,
  finalizeRunEnd,
  normalizeRunState,
  resolveWheelSpin,
  startNextFloor,
  type RunState,
} from "../game/runState";
import { buildWheelOutcome } from "../game/services/wheelResolver";
import { buildResolveContext } from "./useWheelModifiers";
import { resolveSlice } from "../systems/ProbabilityResolver";
import type { SliceDefinition } from "../schemas";
import { useRunStore } from "../stores/runStore";
import { useMetaStore } from "../stores/metaStore";

/**
 * Unified run logic hook — bridges Zustand UI store with modular game layers.
 * Use in screens instead of calling RunManager / runStore ad hoc.
 */
export function useRunLogic() {
  const run = useRunStore((s) => s.run);
  const awaitingClaim = useRunStore((s) => s.ui.awaitingClaim);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const activeWheelIndex = useRunStore((s) => s.ui.activeWheelIndex);
  const lastResultLabel = useRunStore((s) => s.ui.lastResultLabel);
  const shopPending = useRunStore((s) => s.ui.shopPending);
  const ui = useMemo(
    () => ({
      awaitingClaim,
      isSpinning,
      activeWheelIndex,
      lastResultLabel,
      shopPending,
    }),
    [activeWheelIndex, awaitingClaim, isSpinning, lastResultLabel, shopPending]
  );
  const startRunStore = useRunStore((s) => s.startRun);
  const applySpinResult = useRunStore((s) => s.applySpinResult);
  const claimAndAdvance = useRunStore((s) => s.claimAndAdvance);
  const setSpinning = useRunStore((s) => s.setSpinning);
  const grantChips = useMetaStore((s) => s.grantChips);
  const totalChips = useMetaStore((s) => s.totalChips);

  const normalizedRun = useMemo(
    () => (run != null ? normalizeRunState(run as RunState) : null),
    [run]
  );

  const wheelArchetype = useMemo(() => {
    if (normalizedRun == null) return null;
    return getArchetypeForWheelIndex(normalizedRun.wheelIndex);
  }, [normalizedRun]);

  const startRun = useCallback(
    (floor = 1) => {
      startRunStore(floor);
    },
    [startRunStore]
  );

  const pickSliceForCurrentWheel = useCallback((): {
    index: number;
    slice: SliceDefinition;
  } | null => {
    if (normalizedRun == null) return null;
    const wheel = normalizedRun.wheels[normalizedRun.wheelIndex];
    if (wheel == null) return null;
    const ctx = buildResolveContext(normalizedRun, wheel);
    return resolveSlice(wheel.slices, ctx);
  }, [normalizedRun]);

  const previewCurrentOutcome = useCallback(() => {
    if (normalizedRun == null) return null;
    const wheel = normalizedRun.wheels[normalizedRun.wheelIndex];
    const picked = pickSliceForCurrentWheel();
    if (wheel == null || picked == null) return null;
    return buildWheelOutcome(normalizedRun, picked.slice, normalizedRun.wheelIndex);
  }, [normalizedRun, pickSliceForCurrentWheel]);

  const spinCurrentWheel = useCallback(
    (sliceId: string) => {
      if (normalizedRun == null) return;
      applySpinResult(normalizedRun.wheelIndex, sliceId);
    },
    [applySpinResult, normalizedRun]
  );

  const scrollToNextWheel = useCallback(() => {
    claimAndAdvance();
  }, [claimAndAdvance]);

  const endRunAndGrantChips = useCallback(() => {
    if (normalizedRun == null) return null;
    const { result } = finalizeRunEnd(normalizedRun, (chips) => grantChips(chips));
    useMetaStore.getState().recordRunEnd({
      floor: normalizedRun.floor,
      peakMoney: normalizedRun.peakMoney ?? normalizedRun.money,
    });
    return result;
  }, [grantChips, normalizedRun]);

  const continueToNextFloor = useCallback(() => {
    if (normalizedRun == null || normalizedRun.phase !== "won") return;
    const next = startNextFloor(normalizedRun);
    useRunStore.setState({
      run: normalizeRunState(next),
      ui: {
        ...useRunStore.getState().ui,
        activeWheelIndex: 0,
        awaitingClaim: false,
        lastEffect: null,
        lastWonPerkId: null,
        lastRewardKind: null,
      },
    });
  }, [normalizedRun]);

  return {
    run: normalizedRun,
    ui,
    totalChips,
    floorWheelCount: FLOOR_WHEEL_COUNT,
    wheelArchetype,
    canSpin: normalizedRun != null && canSpinWheel(normalizedRun, normalizedRun.wheelIndex),
    chipsEarnedThisRun: normalizedRun?.chipsEarnedThisRun ?? 0,
    pendingJokerOffers: normalizedRun?.pendingJokerOffers ?? [],
    startRun,
    pickSliceForCurrentWheel,
    previewCurrentOutcome,
    spinCurrentWheel,
    scrollToNextWheel,
    setSpinning,
    endRunAndGrantChips,
    continueToNextFloor,
    advanceToNextWheel,
    resolveWheelSpin,
  };
}
