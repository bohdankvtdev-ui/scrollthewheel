import { create } from "zustand";
import type { RunState } from "../schemas";
import { flushRunCheckpoint, saveRunCheckpoint } from "../persistence/mmkv";
import { RUN_DEFAULTS, RUN_LOOP } from "../game/loop";
import { createRunState, normalizeRunState, resolveWheelSpin } from "../game/runState";
import { commitDeferredMoney } from "../game/services/wheelResolver";
import { WHEEL_DATABASE_REVISION } from "../game/wheels/database/wheelDatabase";
import { rebuildWheelsFromDatabase } from "../systems/WheelSystem";
import { computeRunChipAward } from "../game/runState/chipsScoring";
import { RunManager } from "../systems/RunManager";
import { banishSliceOnWheel } from "../game/runState/banishSlice";
import { commitPendingWheelRebuild } from "../systems/PerkSystem";
import { useMetaStore } from "./metaStore";
import { toSliceDisplay } from "../utils/sliceDisplay";
import { getSliceVisualTheme, type SliceVisualTone } from "../game/content/sliceVisualTheme";
import type { IconFamily } from "../schemas";

export type RunUiEffect = {
  icon: string;
  iconFamily: IconFamily;
  shortLabel: string;
  effectHint: string;
  accent: string;
  iconColor: string;
  tone: SliceVisualTone;
};

function applyPendingMoneyReveal(
  run: RunState,
  moneyReveal: { before: number; delta: number } | null
): RunState {
  if (moneyReveal == null) return run;
  let next = commitDeferredMoney(run, moneyReveal.delta, run.wheelIndex);
  return RunManager.checkRunEnd(next) as RunState;
}

function hasPendingSolventReveal(moneyReveal: { before: number; delta: number } | null): boolean {
  if (moneyReveal == null) return false;
  return moneyReveal.before + moneyReveal.delta > RUN_DEFAULTS.bankruptcyThreshold;
}

const emptyUi = {
  activeWheelIndex: 0,
  isSpinning: false,
  scrollTarget: null as number | null,
  lastResultLabel: null as string | null,
  lastSliceId: null as string | null,
  awaitingClaim: false,
  lastEffect: null as RunUiEffect | null,
  lastWonPerkId: null as string | null,
  lastRewardKind: null as string | null,
  shopPending: false,
  sliceEraseMode: false,
  showCycleReward: false,
  moneyReveal: null as { before: number; delta: number } | null,
};

type RunUiState = typeof emptyUi;

type RunStore = {
  run: RunState | null;
  ui: RunUiState;
  startRun: (floor?: number) => void;
  hydrateRun: (run: RunState | null) => void;
  setSpinning: (v: boolean) => void;
  setScrollTarget: (index: number | null) => void;
  setLastResult: (label: string | null) => void;
  applySpinResult: (wheelIndex: number, sliceId: string) => void;
  claimAndAdvance: () => void;
  clearShopPending: () => void;
  commitWheelLayout: () => void;
  advanceWheel: () => void;
  persist: () => void;
  reset: () => void;
  setSliceEraseMode: (on: boolean) => void;
  banishSliceAt: (
    wheelIndex: number,
    sliceIndex: number
  ) => { ok: true } | { ok: false; reason: string };
  continueAfterCycleReward: () => void;
  dismissCycleReward: () => void;
  commitMoneyReveal: () => void;
};

export const useRunStore = create<RunStore>((set, get) => ({
  run: null,
  ui: { ...emptyUi },

  startRun: (floor = 1) => {
    const run = rebuildWheelsFromDatabase({
      ...createRunState(floor),
      wheelDbRevision: WHEEL_DATABASE_REVISION,
    });
    set({
      run,
      ui: { ...emptyUi },
    });
    saveRunCheckpoint(run);
    flushRunCheckpoint();
  },

  hydrateRun: (run) => {
    set({
      run: run != null ? normalizeRunState(run) : null,
      ui: {
        ...emptyUi,
        activeWheelIndex: run?.wheelIndex ?? 0,
      },
    });
  },

  setSpinning: (v) => set((s) => ({ ui: { ...s.ui, isSpinning: v } })),

  setScrollTarget: (index) => set((s) => ({ ui: { ...s.ui, scrollTarget: index } })),

  setLastResult: (label) => set((s) => ({ ui: { ...s.ui, lastResultLabel: label } })),

  applySpinResult: (wheelIndex, sliceId) => {
    const { run } = get();
    if (run == null) return;
    const wheel = run.wheels[wheelIndex];
    const slice = wheel?.slices.find((s) => s.id === sliceId);
    if (slice == null) return;
    const perkId = slice.payload.perkId;
    const resolved = resolveWheelSpin(normalizeRunState(run), wheelIndex, slice);
    const next = resolved.run;
    const perkWasNew =
      perkId != null && !run.perks.includes(perkId) && next.perks.includes(perkId);
    const display = toSliceDisplay(slice);
    const sliceIndex = wheel?.slices.findIndex((s) => s.id === sliceId) ?? 0;
    const visual = getSliceVisualTheme(slice.kind, slice.weightTags, { sliceIndex });
    const lastEffect: RunUiEffect = {
      icon: display.icon,
      iconFamily: display.iconFamily,
      shortLabel: display.shortLabel,
      effectHint: display.effectHint,
      accent: slice.presentation?.chipColor ?? visual.chipBg,
      iconColor: slice.presentation?.iconColor ?? visual.iconColor,
      tone: visual.tone,
    };
    set({
      run: next,
      ui: {
        ...get().ui,
        isSpinning: false,
        lastResultLabel: slice.label,
        lastSliceId: slice.id,
        awaitingClaim: next.phase === "active",
        shopPending:
          RUN_LOOP.shopHighlightAfterEachWheel && next.phase === "active",
        sliceEraseMode: false,
        lastEffect,
        lastWonPerkId: perkWasNew ? perkId! : null,
        lastRewardKind: slice.kind,
        moneyReveal: resolved.moneyReveal ?? null,
      },
    });
    if (next.phase === "won") {
      set((s) => ({ ui: { ...s.ui, showCycleReward: true } }));
    }
    if (next.phase === "lost_money" && !hasPendingSolventReveal(resolved.moneyReveal ?? null)) {
      const chips = computeRunChipAward(next);
      useMetaStore.getState().grantChips(chips);
      useMetaStore.getState().recordRunEnd({
        floor: next.floor,
        peakMoney: next.peakMoney ?? next.money,
      });
    }
    saveRunCheckpoint(next);
    if (next.phase !== "active") flushRunCheckpoint();
  },

  commitWheelLayout: () => {
    const { run } = get();
    if (run == null || !run.pendingWheelRebuild) return;
    const next = commitPendingWheelRebuild(run);
    set({ run: next });
    saveRunCheckpoint(next);
  },

  claimAndAdvance: () => {
    const { run, ui } = get();
    if (run == null || !ui.awaitingClaim || run.phase !== "active") return;
    const afterMoney = applyPendingMoneyReveal(run, ui.moneyReveal);
    if (afterMoney.phase !== "active") {
      if (afterMoney.phase === "lost_money") {
        const chips = computeRunChipAward(afterMoney);
        useMetaStore.getState().grantChips(chips);
        useMetaStore.getState().recordRunEnd({
          floor: afterMoney.floor,
          peakMoney: afterMoney.peakMoney ?? afterMoney.money,
        });
      }
      set({
        run: afterMoney,
        ui: {
          ...get().ui,
          awaitingClaim: false,
          moneyReveal: null,
        },
      });
      saveRunCheckpoint(afterMoney);
      flushRunCheckpoint();
      return;
    }
    const committed = commitPendingWheelRebuild(afterMoney);
    const next = normalizeRunState(RunManager.advanceWheel(committed));
    if (next.phase === "won") {
      set((s) => ({ ui: { ...s.ui, showCycleReward: true } }));
    }
    if (next.phase === "lost_money") {
      const chips = computeRunChipAward(next);
      useMetaStore.getState().grantChips(chips);
      useMetaStore.getState().recordRunEnd({
        floor: next.floor,
        peakMoney: next.peakMoney ?? next.money,
      });
    }
    set({
      run: next,
      ui: {
        ...get().ui,
        activeWheelIndex: next.wheelIndex,
        scrollTarget: next.wheelIndex,
        awaitingClaim: false,
        isSpinning: false,
        lastResultLabel: null,
        lastSliceId: null,
        lastEffect: null,
        lastWonPerkId: null,
        lastRewardKind: null,
        shopPending: false,
        sliceEraseMode: false,
        moneyReveal: null,
      },
    });
    saveRunCheckpoint(next);
    if (next.phase !== "active") flushRunCheckpoint();
  },

  clearShopPending: () => {
    set((s) => ({ ui: { ...s.ui, shopPending: false } }));
  },

  advanceWheel: () => {
    const { run } = get();
    if (run == null) return;
    const next = RunManager.advanceWheel(run);
    set({
      run: next,
      ui: {
        ...get().ui,
        activeWheelIndex: next.wheelIndex,
        scrollTarget: next.wheelIndex,
      },
    });
    saveRunCheckpoint(next);
  },

  persist: () => {
    saveRunCheckpoint(get().run);
    flushRunCheckpoint();
  },

  reset: () => {
    saveRunCheckpoint(null);
    set({
      run: null,
      ui: { ...emptyUi },
    });
  },

  setSliceEraseMode: (on) => {
    set((s) => ({ ui: { ...s.ui, sliceEraseMode: on } }));
  },

  banishSliceAt: (wheelIndex, sliceIndex) => {
    const { run } = get();
    if (run == null) return { ok: false, reason: "No active run" };
    const result = banishSliceOnWheel(run, wheelIndex, sliceIndex);
    if (!result.ok) return result;
    set({
      run: result.run,
      ui: { ...get().ui, sliceEraseMode: false },
    });
    saveRunCheckpoint(result.run);
    return { ok: true };
  },

  continueAfterCycleReward: () => {
    const { run } = get();
    if (run == null || run.phase !== "won") return;
    const next = normalizeRunState(RunManager.enterInfiniteFloor(run));
    set({
      run: next,
      ui: {
        ...emptyUi,
        activeWheelIndex: 0,
        scrollTarget: 0,
        showCycleReward: false,
      },
    });
    saveRunCheckpoint(next);
  },

  dismissCycleReward: () => {
    set((s) => ({ ui: { ...s.ui, showCycleReward: false } }));
  },

  commitMoneyReveal: () => {
    const { run, ui } = get();
    if (run == null || ui.moneyReveal == null) return;
    const next = applyPendingMoneyReveal(run, ui.moneyReveal);
    set({
      run: next,
      ui: { ...ui, moneyReveal: null },
    });
    saveRunCheckpoint(next);
  },
}));
