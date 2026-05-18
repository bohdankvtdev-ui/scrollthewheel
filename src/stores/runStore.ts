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
import { laserRemoveSliceFromWheel } from "../game/runState/laserSlice";
import { applyInsuredWheelOnIndex } from "../game/tactics/applyInsureWheel";
import {
  canUseMicroChoice,
  payMicroChoice,
  rollMicroChoiceOffers,
  type MicroChoiceId,
} from "../game/tactics/microChoices";
import { applyPitStopChoice, type PitStopOptionId } from "../game/tactics/cyclePitStop";
import { grantEarlyRunChipBonusOnSpinComplete } from "../game/tactics/earlyRunChips";
import { getGambleSliceById } from "../game/tactics/gambleWheel";
import { declineTacticOffersOnWheel, tacticUsedOnWheel } from "../game/tactics/tacticState";
import { isTacticDecisionWheel, withTacticWheelIndices } from "../game/tactics/tacticWheels";
import {
  clearTacticOffersOnRun,
  labelFromHistory,
  reconcileRunUi,
  type RunUiTacticFields,
} from "../game/tactics/wheelHubState";
import { WHEEL_COUNT } from "../game/loop";
import { commitPendingWheelRebuild } from "../systems/PerkSystem";
import { useMetaStore } from "./metaStore";
import { showRunNotice } from "../game/notices/runNotices";
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
  lastWonDebuffId: null as string | null,
  lastRewardKind: null as string | null,
  shopPending: false,
  sliceEraseMode: false,
  showCycleReward: false,
  moneyReveal: null as { before: number; delta: number } | null,
  gambleFlipActive: false,
  spinWheelIndex: null as number | null,
};

type RunUiState = typeof emptyUi;

function cloneRun(run: RunState): RunState {
  return JSON.parse(JSON.stringify(run)) as RunState;
}

function microChoiceUsedOnWheel(run: RunState, wheelIndex: number): boolean {
  return tacticUsedOnWheel(run, wheelIndex);
}

function mergeUi(
  run: RunState,
  currentUi: RunUiState,
  patch: Partial<RunUiState>
): RunUiState {
  const merged = { ...currentUi, ...patch };
  return reconcileRunUi(run, merged as RunUiTacticFields) as RunUiState;
}

type RunStore = {
  run: RunState | null;
  preSpinSnapshot: RunState | null;
  ui: RunUiState;
  startRun: (floor?: number) => void;
  hydrateRun: (run: RunState | null) => void;
  healRunUi: () => void;
  clearSpinInteraction: () => void;
  setSpinning: (v: boolean) => void;
  setScrollTarget: (index: number | null) => void;
  setLastResult: (label: string | null) => void;
  applySpinResult: (wheelIndex: number, sliceId: string) => void;
  applyGambleFlipResult: (wheelIndex: number, sliceId: string) => void;
  claimAndAdvance: () => boolean;
  clearShopPending: () => void;
  clearLastWonPerk: () => void;
  clearLastWonDebuff: () => void;
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
  useMicroChoice: (id: MicroChoiceId) => { ok: true } | { ok: false; reason: string };
  dismissTacticOffers: () => void;
  applyPitStop: (id: PitStopOptionId) => void;
};

export const useRunStore = create<RunStore>((set, get) => ({
  run: null,
  preSpinSnapshot: null,
  ui: { ...emptyUi },

  startRun: (floor = 1) => {
    const run = withTacticWheelIndices(
      rebuildWheelsFromDatabase({
        ...createRunState(floor),
        wheelDbRevision: WHEEL_DATABASE_REVISION,
      })
    );
    set({
      run,
      ui: { ...emptyUi },
    });
    saveRunCheckpoint(run);
    flushRunCheckpoint();
  },

  hydrateRun: (run) => {
    if (run == null) {
      set({ run: null, preSpinSnapshot: null, ui: { ...emptyUi } });
      return;
    }
    const normalized = normalizeRunState(run);
    const wi = normalized.wheelIndex;
    const lastOnWheel = [...normalized.history]
      .reverse()
      .find((h) => h.wheelIndex === wi);
    const uiSeed: RunUiTacticFields = {
      ...emptyUi,
      activeWheelIndex: wi,
      awaitingClaim: normalized.phase === "active" && lastOnWheel != null,
      isSpinning: false,
      spinWheelIndex: null,
      gambleFlipActive: false,
      lastSliceId: lastOnWheel?.sliceId ?? null,
      lastResultLabel:
        lastOnWheel != null ? labelFromHistory(normalized, wi) : null,
      lastEffect: null,
      lastRewardKind: null,
      moneyReveal: null,
    };
    set({
      run: normalized,
      preSpinSnapshot: null,
      ui: reconcileRunUi(normalized, uiSeed) as RunUiState,
    });
  },

  healRunUi: () => {
    const { run, ui } = get();
    if (run == null) return;
    const next = reconcileRunUi(run, ui as RunUiTacticFields) as RunUiState;
    if (
      next.awaitingClaim !== ui.awaitingClaim ||
      next.gambleFlipActive !== ui.gambleFlipActive ||
      next.lastResultLabel !== ui.lastResultLabel ||
      next.isSpinning !== ui.isSpinning ||
      next.spinWheelIndex !== ui.spinWheelIndex
    ) {
      set({ ui: next });
    }
  },

  clearSpinInteraction: () => {
    set((s) => {
      if (!s.ui.isSpinning && s.ui.spinWheelIndex == null) return s;
      if (s.run == null) {
        return { ui: { ...s.ui, isSpinning: false, spinWheelIndex: null } };
      }
      return {
        ui: mergeUi(s.run, s.ui, { isSpinning: false, spinWheelIndex: null }),
      };
    });
  },

  setSpinning: (v) => {
    if (v) {
      const { run } = get();
      const needsRerollSnapshot =
        run != null && isTacticDecisionWheel(run, run.wheelIndex);
      set({
        preSpinSnapshot: needsRerollSnapshot ? cloneRun(run) : null,
        ui: {
          ...get().ui,
          isSpinning: true,
          spinWheelIndex: run?.wheelIndex ?? null,
        },
      });
      return;
    }
    set((s) => {
      if (s.run == null) {
        return { ui: { ...s.ui, isSpinning: false, spinWheelIndex: null } };
      }
      return {
        ui: mergeUi(s.run, s.ui, { isSpinning: false, spinWheelIndex: null }),
      };
    });
  },

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
    const next =
      resolved.run.pendingWheelRebuild === true
        ? commitPendingWheelRebuild(resolved.run)
        : resolved.run;
    const debuffId = slice.payload.debuffId;
    const perkWasNew =
      perkId != null && !run.perks.includes(perkId) && next.perks.includes(perkId);
    const shieldPerkWasNew =
      perkId != null &&
      !(run.shieldPerks ?? []).includes(perkId) &&
      (next.shieldPerks ?? []).includes(perkId);
    const debuffWasNew =
      debuffId != null && !run.debuffs.includes(debuffId) && next.debuffs.includes(debuffId);
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
    const moneyReveal = resolved.moneyReveal ?? null;

    let runWithOffers = next;
    const earlyChip = grantEarlyRunChipBonusOnSpinComplete(next, wheelIndex);
    runWithOffers = earlyChip.run;
    if (earlyChip.grant != null) {
      showRunNotice({
        type: "success",
        title: "Early chips",
        body: earlyChip.grant.label,
        icon: "poker-chip",
      });
    }

    if (
      runWithOffers.phase === "active" &&
      isTacticDecisionWheel(runWithOffers, wheelIndex)
    ) {
      const offers = rollMicroChoiceOffers(runWithOffers, wheelIndex, {
        hasPreSpinSnapshot: get().preSpinSnapshot != null,
      });
      if (offers.length > 0) {
        runWithOffers = {
          ...runWithOffers,
          runEffects: {
            ...runWithOffers.runEffects,
            microChoiceOffers: offers,
            microChoiceOffersWheel: wheelIndex,
          },
        };
      }
    }

    if (resolved.shieldBlocked) {
      showRunNotice({
        type: "success",
        title: "Shield blocked the hit",
        icon: "shield",
      });
    } else if (resolved.debtShieldBlocked) {
      showRunNotice({
        type: "success",
        title: "Debt Shield",
        body: "Saved your bank",
        icon: "shield",
      });
    } else if ((slice.payload.sliceDelta ?? 0) > 0) {
      showRunNotice({
        type: "success",
        title: `+${slice.payload.sliceDelta} wedge`,
        body: "On every wheel this cycle",
        icon: "album",
      });
    }

    const { ui: uiNow, preSpinSnapshot: snap } = get();
    const offers = runWithOffers.runEffects?.microChoiceOffers;
    const keepPreSpinSnapshot =
      snap != null && offers != null && offers.includes("reroll");

    set({
      run: runWithOffers,
      preSpinSnapshot: keepPreSpinSnapshot ? snap : null,
      ui: mergeUi(runWithOffers, uiNow, {
        isSpinning: false,
        spinWheelIndex: null,
        gambleFlipActive: false,
        lastResultLabel: slice.label,
        lastSliceId: slice.id,
        awaitingClaim: runWithOffers.phase === "active",
        shopPending:
          RUN_LOOP.shopHighlightAfterEachWheel && runWithOffers.phase === "active",
        sliceEraseMode: false,
        lastEffect,
        lastWonPerkId: perkWasNew || shieldPerkWasNew ? perkId! : null,
        lastWonDebuffId: debuffWasNew ? debuffId! : null,
        lastRewardKind: slice.kind,
        moneyReveal,
      }),
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
    saveRunCheckpoint(runWithOffers);
    if (runWithOffers.phase !== "active") flushRunCheckpoint();
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
    if (run == null || !ui.awaitingClaim || run.phase !== "active") return false;
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
      return true;
    }
    const committed = commitPendingWheelRebuild(afterMoney);
    let next = clearTacticOffersOnRun(normalizeRunState(RunManager.advanceWheel(committed)));
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
      ui: mergeUi(next, ui, {
        activeWheelIndex: next.wheelIndex,
        scrollTarget: next.wheelIndex,
        awaitingClaim: false,
        isSpinning: false,
        spinWheelIndex: null,
        lastResultLabel: null,
        lastSliceId: null,
        lastEffect: null,
        lastWonPerkId: null,
        lastWonDebuffId: null,
        lastRewardKind: null,
        shopPending: false,
        sliceEraseMode: false,
        moneyReveal: null,
        gambleFlipActive: false,
      }),
    });
    set({ preSpinSnapshot: null });
    saveRunCheckpoint(next);
    if (next.phase !== "active") flushRunCheckpoint();
    return true;
  },

  applyGambleFlipResult: (wheelIndex, sliceId) => {
    const { run, ui: uiNow } = get();
    if (run == null || !uiNow.gambleFlipActive) return;
    const slice = getGambleSliceById(sliceId);
    if (slice == null) return;

    const resolved = resolveWheelSpin(normalizeRunState(run), wheelIndex, slice);
    const next =
      resolved.run.pendingWheelRebuild === true
        ? commitPendingWheelRebuild(resolved.run)
        : resolved.run;
    const display = toSliceDisplay(slice);
    const visual = getSliceVisualTheme(slice.kind, slice.weightTags, { sliceIndex: 0 });
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
      ui: mergeUi(next, uiNow, {
        isSpinning: false,
        spinWheelIndex: null,
        gambleFlipActive: false,
        awaitingClaim: next.phase === "active",
        lastResultLabel: slice.label,
        lastSliceId: slice.id,
        lastEffect,
        lastRewardKind: slice.kind,
        moneyReveal: resolved.moneyReveal ?? null,
      }),
    });
    saveRunCheckpoint(next);
  },

  useMicroChoice: (id) => {
    const { run, preSpinSnapshot, ui } = get();
    if (run == null || !ui.awaitingClaim) {
      return { ok: false, reason: "Finish the spin first" };
    }
    const wheelIndex = run.wheelIndex;
    const offers =
      run.runEffects?.microChoiceOffers ??
      rollMicroChoiceOffers(run, wheelIndex, {
        hasPreSpinSnapshot: preSpinSnapshot != null,
      });
    const check = canUseMicroChoice(run, id, {
      hasPreSpinSnapshot: preSpinSnapshot != null,
      alreadyUsedThisWheel: microChoiceUsedOnWheel(run, wheelIndex),
      isLastWheel: wheelIndex >= WHEEL_COUNT - 1,
      offers,
      gambleFlipActive: get().ui.gambleFlipActive,
    });
    if (!check.ok) return check;

    if (id === "reroll") {
      if (preSpinSnapshot == null) return { ok: false, reason: "Re-spin unavailable" };
      const paid = payMicroChoice(run, id);
      if (paid == null) return { ok: false, reason: "Not enough chips" };
      const restored = cloneRun(preSpinSnapshot);
      restored.chipsEarnedThisRun = paid.chipsEarnedThisRun;
      restored.runEffects = {
        ...restored.runEffects,
        microChoiceWheelIndex: wheelIndex,
        tacticUsedId: "reroll",
        microChoiceOffers: undefined,
        microChoiceOffersWheel: undefined,
      };
      set({
        run: restored,
        preSpinSnapshot: null,
        ui: mergeUi(restored, emptyUi, {
          activeWheelIndex: wheelIndex,
          scrollTarget: wheelIndex,
          isSpinning: false,
          spinWheelIndex: null,
          gambleFlipActive: false,
          awaitingClaim: false,
        }),
      });
      saveRunCheckpoint(restored);
      return { ok: true };
    }

    if (id === "gamble") {
      let nextRun = run;
      if (ui.moneyReveal != null) {
        nextRun = applyPendingMoneyReveal(run, ui.moneyReveal);
      }
      const paid = payMicroChoice(nextRun, id);
      if (paid == null) return { ok: false, reason: "Not enough chips" };
      const afterGamble = {
        ...paid,
        runEffects: {
          ...paid.runEffects,
          microChoiceWheelIndex: wheelIndex,
          tacticUsedId: "gamble",
          microChoiceOffers: undefined,
          microChoiceOffersWheel: undefined,
        },
      };
      set({
        run: afterGamble,
        ui: mergeUi(afterGamble, ui, {
          awaitingClaim: false,
          moneyReveal: null,
          gambleFlipActive: true,
          isSpinning: false,
          spinWheelIndex: null,
        }),
      });
      saveRunCheckpoint(get().run!);
      return { ok: true };
    }

    const paid = payMicroChoice(run, id);
    if (paid == null) return { ok: false, reason: "Not enough chips" };

    if (id === "insure") {
      const nextIdx = wheelIndex + 1;
      const afterInsure = applyInsuredWheelOnIndex(
        {
          ...paid,
          runEffects: {
            ...paid.runEffects,
            insureNextWheel: false,
            microChoiceWheelIndex: wheelIndex,
            tacticUsedId: id,
            microChoiceOffers: undefined,
            microChoiceOffersWheel: undefined,
          },
        },
        nextIdx
      );
      set({ run: afterInsure, ui: mergeUi(afterInsure, ui, {}) });
      saveRunCheckpoint(get().run!);
      return { ok: true };
    }

    return { ok: false, reason: "Unknown tactic" };
  },

  dismissTacticOffers: () => {
    const { run } = get();
    if (run == null || run.phase !== "active") return;
    const next = declineTacticOffersOnWheel(run, run.wheelIndex);
    set({ run: next });
    saveRunCheckpoint(next);
  },

  applyPitStop: (id) => {
    const { run } = get();
    if (run == null || run.phase !== "won") return;
    const withReward = applyPitStopChoice(run, id);
    set({
      run: {
        ...withReward,
        runEffects: { ...withReward.runEffects, pitStopPending: false },
      },
    });
    saveRunCheckpoint(get().run!);
  },

  clearShopPending: () => {
    set((s) => ({ ui: { ...s.ui, shopPending: false } }));
  },

  clearLastWonPerk: () => {
    set((s) => ({ ui: { ...s.ui, lastWonPerkId: null } }));
  },

  clearLastWonDebuff: () => {
    set((s) => ({ ui: { ...s.ui, lastWonDebuffId: null } }));
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
      preSpinSnapshot: null,
      ui: { ...emptyUi },
    });
  },

  setSliceEraseMode: (on) => {
    set((s) => ({ ui: { ...s.ui, sliceEraseMode: on } }));
  },

  banishSliceAt: (wheelIndex, sliceIndex) => {
    const { run } = get();
    if (run == null) return { ok: false, reason: "No active run" };
    const result = laserRemoveSliceFromWheel(run, wheelIndex, sliceIndex);
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
    const next = withTacticWheelIndices(normalizeRunState(RunManager.enterInfiniteFloor(run)));
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
