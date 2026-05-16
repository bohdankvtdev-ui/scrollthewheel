import { create } from "zustand";
import type { RunState } from "../schemas";
import { saveRunCheckpoint } from "../persistence/mmkv";
import { RUN_LOOP } from "../game/loop";
import { createRunState, normalizeRunState, resolveWheelSpin } from "../game/runState";
import { WHEEL_DATABASE_REVISION } from "../game/wheels/database/wheelDatabase";
import { rebuildWheelsFromDatabase } from "../systems/WheelSystem";
import { computeRunChipAward } from "../game/runState/chipsScoring";
import { RunManager } from "../systems/RunManager";
import { commitPendingWheelRebuild } from "../systems/PerkSystem";
import { useMetaStore } from "./metaStore";
import { toSliceDisplay } from "../utils/sliceDisplay";
import { sliceAccentForKind } from "../utils/sliceAccent";
import type { IconFamily } from "../schemas";

export type RunUiEffect = {
  icon: string;
  iconFamily: IconFamily;
  shortLabel: string;
  effectHint: string;
  accent: string;
};

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
    const next = resolveWheelSpin(normalizeRunState(run), wheelIndex, slice);
    const perkWasNew =
      perkId != null && !run.perks.includes(perkId) && next.perks.includes(perkId);
    const display = toSliceDisplay(slice);
    const lastEffect: RunUiEffect = {
      icon: display.icon,
      iconFamily: display.iconFamily,
      shortLabel: display.shortLabel,
      effectHint: display.effectHint,
      accent: sliceAccentForKind(slice.kind),
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
        lastEffect,
        lastWonPerkId: perkWasNew ? perkId! : null,
        lastRewardKind: slice.kind,
      },
    });
    if (next.phase !== "active") {
      const chips = computeRunChipAward(next);
      useMetaStore.getState().grantChips(chips);
      useMetaStore.getState().recordRunEnd(next.floor);
    }
    saveRunCheckpoint(next);
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
    const committed = commitPendingWheelRebuild(run);
    const next = normalizeRunState(RunManager.advanceWheel(committed));
    if (next.phase !== "active") {
      const chips = computeRunChipAward(next);
      useMetaStore.getState().grantChips(chips);
      useMetaStore.getState().recordRunEnd(next.floor);
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
      },
    });
    saveRunCheckpoint(next);
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
  },

  reset: () => {
    saveRunCheckpoint(null);
    set({
      run: null,
      ui: { ...emptyUi },
    });
  },
}));
