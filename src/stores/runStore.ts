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
import {
  canDismissBossOverlay,
  cancelBossCycleRewardApply,
  scheduleBossCycleRewardApply,
} from "../game/cycle/bossCycleFlow";
import {
  isBossWheelClaim,
  transitionRunAfterBossClear,
} from "../game/cycle/cycleTransition";
import { isBankruptMoneyReveal } from "../game/moneyReveal";
import {
  payBailout,
  rollDesperationOffers,
  type DesperationId,
} from "../game/tactics/desperationTactics";
import { WHEEL_COUNT } from "../game/loop";
import { commitPendingWheelRebuild } from "../systems/PerkSystem";
import { useMetaStore } from "./metaStore";
import {
  showDebuffWonNotice,
  showPerkWonNotice,
  showRelicWonNotice,
  showRunNotice,
  showShieldPerkNotice,
} from "../game/notices/runNotices";
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
  chipReveal: null as { before: number; delta: number } | null,
  gambleFlipActive: false,
  spinWheelIndex: null as number | null,
  showDesperationPick: false,
  desperationOffers: [] as DesperationId[],
  runEndFinalized: false,
  /** Boss wheel → scroll away wheel, cycle reward panel, then wheel 1. */
  bossCyclePhase: "none" as "none" | "reward",
  /** Boss slice result shown on the cycle reward panel. */
  bossSliceEffect: null as RunUiEffect | null,
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

function finalizeRunEnd(run: RunState): void {
  const state = useRunStore.getState();
  if (state.ui.runEndFinalized) return;
  if (run.phase !== "lost_money") return;
  const chips = computeRunChipAward(run);
  useMetaStore.getState().grantChips(chips);
  useMetaStore.getState().recordRunEnd({
    floor: run.floor,
    peakMoney: run.peakMoney ?? run.money,
  });
  useRunStore.setState((s) => ({
    run,
    ui: {
      ...s.ui,
      showDesperationPick: false,
      desperationOffers: [],
      runEndFinalized: true,
      awaitingClaim: false,
      moneyReveal: null,
    },
  }));
  flushRunCheckpoint(run);
}

function applyLossOrDesperation(run: RunState): void {
  if (run.phase !== "lost_money") return;
  const { preSpinSnapshot } = useRunStore.getState();
  const offers = rollDesperationOffers(run, {
    hasPreSpinSnapshot: preSpinSnapshot != null,
  });
  if (offers.length > 0) {
    useRunStore.setState((s) => ({
      run: {
        ...run,
        runEffects: { ...run.runEffects, desperationOfferedThisRun: true },
      },
      ui: {
        ...s.ui,
        showDesperationPick: true,
        desperationOffers: offers,
        runEndFinalized: false,
        awaitingClaim: false,
        moneyReveal: null,
        isSpinning: false,
        spinWheelIndex: null,
      },
    }));
    saveRunCheckpoint(useRunStore.getState().run!);
    return;
  }
  finalizeRunEnd(run);
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
  /** After wheel scroll-off: apply cycle rewards and show reward panel. */
  commitBossCycleReward: () => void;
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
  continueAfterCycleReward: (pitId?: PitStopOptionId) => void;
  continueInfiniteAfterAlpha: () => void;
  endRunAfterAlpha: () => void;
  revealCycleClearOverlay: () => void;
  dismissCycleReward: () => void;
  commitMoneyReveal: () => void;
  commitChipReveal: () => void;
  useMicroChoice: (id: MicroChoiceId) => { ok: true } | { ok: false; reason: string };
  useDesperationChoice: (id: DesperationId) => { ok: true } | { ok: false; reason: string };
  dismissDesperationPick: () => void;
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
      set({
        preSpinSnapshot:
          run != null && run.phase === "active" ? cloneRun(run) : null,
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
    const relicId = slice.payload.relicId;
    const perkWasNew =
      perkId != null && !run.perks.includes(perkId) && next.perks.includes(perkId);
    const shieldPerkWasNew =
      perkId != null &&
      !(run.shieldPerks ?? []).includes(perkId) &&
      (next.shieldPerks ?? []).includes(perkId);
    const debuffWasNew =
      debuffId != null && !run.debuffs.includes(debuffId) && next.debuffs.includes(debuffId);
    const relicWasNew =
      relicId != null && !run.relics.includes(relicId) && next.relics.includes(relicId);
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
    const chipsBeforeSpin = run.chipsEarnedThisRun ?? 0;

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
      isTacticDecisionWheel(runWithOffers, wheelIndex) &&
      !tacticUsedOnWheel(runWithOffers, wheelIndex)
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

    if (debuffWasNew && debuffId != null) {
      showDebuffWonNotice(debuffId);
    } else if (relicWasNew && relicId != null) {
      showRelicWonNotice(relicId);
    } else if (perkWasNew && perkId != null) {
      showPerkWonNotice(perkId);
    } else if (shieldPerkWasNew && perkId != null) {
      showShieldPerkNotice(perkId);
    }

    const chipsAfterSpin = runWithOffers.chipsEarnedThisRun ?? 0;
    const chipDelta = chipsAfterSpin - chipsBeforeSpin;
    const chipReveal = chipDelta > 0 ? { before: chipsBeforeSpin, delta: chipDelta } : null;

    const { ui: uiNow, preSpinSnapshot: snap } = get();
    const offers = runWithOffers.runEffects?.microChoiceOffers;
    const wouldBankrupt =
      runWithOffers.phase === "lost_money" ||
      isBankruptMoneyReveal(moneyReveal);
    const keepPreSpinSnapshot =
      snap != null &&
      ((offers != null && offers.includes("reroll")) || wouldBankrupt);

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
        chipReveal,
        showCycleReward: false,
      }),
    });
    const pendingBankruptReveal =
      moneyReveal != null && isBankruptMoneyReveal(moneyReveal);
    if (runWithOffers.phase === "lost_money" && !pendingBankruptReveal) {
      applyLossOrDesperation(runWithOffers);
    } else {
      saveRunCheckpoint(runWithOffers);
      if (runWithOffers.phase !== "active" && !pendingBankruptReveal) {
        flushRunCheckpoint();
      }
    }
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
    if (ui.bossCyclePhase !== "none") return true;
    const chipsBeforeClaim = run.chipsEarnedThisRun ?? 0;
    const afterMoney = applyPendingMoneyReveal(run, ui.moneyReveal);
    const claimChipDelta = (afterMoney.chipsEarnedThisRun ?? 0) - chipsBeforeClaim;
    const claimChipReveal =
      claimChipDelta > 0 ? { before: chipsBeforeClaim, delta: claimChipDelta } : ui.chipReveal;
    if (afterMoney.phase !== "active") {
      if (afterMoney.phase === "lost_money") {
        applyLossOrDesperation(afterMoney);
      } else {
        set({
          run: afterMoney,
          ui: {
            ...get().ui,
            awaitingClaim: false,
            moneyReveal: null,
            chipReveal: null,
          },
        });
        saveRunCheckpoint(afterMoney);
        flushRunCheckpoint();
      }
      return true;
    }
    const committed = commitPendingWheelRebuild(afterMoney);
    const bossClear = isBossWheelClaim(committed, committed.wheelIndex);
    if (bossClear) {
      const cleared = clearTacticOffersOnRun(committed);
      const bossSliceEffect = ui.lastEffect;
      const wi = cleared.wheelIndex;
      set({
        run: cleared,
        preSpinSnapshot: null,
        ui: mergeUi(cleared, ui, {
          bossCyclePhase: "reward",
          bossSliceEffect,
          activeWheelIndex: wi,
          scrollTarget: wi,
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
          chipReveal: null,
          gambleFlipActive: false,
          showCycleReward: false,
        }),
      });
      saveRunCheckpoint(cleared);
      scheduleBossCycleRewardApply(() => {
        const st = get();
        if (st.run == null || st.ui.bossCyclePhase !== "reward") return;
        const next = transitionRunAfterBossClear(commitPendingWheelRebuild(st.run));
        set({
          run: next,
          ui: mergeUi(next, st.ui, {
            activeWheelIndex: 0,
            scrollTarget: 0,
          }),
        });
        saveRunCheckpoint(next);
      });
      return true;
    }
    const next = clearTacticOffersOnRun(normalizeRunState(RunManager.advanceWheel(committed)));
    if (next.phase === "lost_money") {
      applyLossOrDesperation(next);
      return true;
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
        chipReveal: claimChipReveal,
        gambleFlipActive: false,
        showCycleReward: false,
      }),
    });
    set({ preSpinSnapshot: null });
    saveRunCheckpoint(next);
    if (next.phase !== "active") flushRunCheckpoint();
    return true;
  },

  commitBossCycleReward: () => {
    const { run, ui } = get();
    if (run == null || ui.bossCyclePhase !== "reward" || run.phase === "active") return;
    const next = transitionRunAfterBossClear(commitPendingWheelRebuild(run));
    set({
      run: next,
      preSpinSnapshot: null,
      ui: mergeUi(next, ui, {
        bossCyclePhase: "reward",
        activeWheelIndex: 0,
        scrollTarget: 0,
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
        chipReveal: null,
        gambleFlipActive: false,
        showCycleReward: false,
      }),
    });
    saveRunCheckpoint(next);
    flushRunCheckpoint();
  },

  revealCycleClearOverlay: () => {
    const { run, ui } = get();
    if (run == null || (run.phase !== "won" && run.phase !== "alpha_won") || ui.showCycleReward) return;
    set((s) => ({ ui: { ...s.ui, showCycleReward: true } }));
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

  useDesperationChoice: (id) => {
    const { run, preSpinSnapshot, ui } = get();
    if (run == null || !ui.showDesperationPick) {
      return { ok: false, reason: "No last-chance offer" };
    }
    const offers = ui.desperationOffers;
    if (id === "reroll") {
      if (preSpinSnapshot == null) return { ok: false, reason: "Retry unavailable" };
      const paid = payMicroChoice(run, "reroll");
      if (paid == null) return { ok: false, reason: "Not enough chips" };
      const restored = cloneRun(preSpinSnapshot);
      restored.chipsEarnedThisRun = paid.chipsEarnedThisRun;
      restored.runEffects = {
        ...restored.runEffects,
        desperationOfferedThisRun: true,
      };
      set({
        run: restored,
        preSpinSnapshot: null,
        ui: mergeUi(restored, emptyUi, {
          activeWheelIndex: restored.wheelIndex,
          scrollTarget: restored.wheelIndex,
          showDesperationPick: false,
          desperationOffers: [],
          runEndFinalized: false,
          isSpinning: false,
          spinWheelIndex: null,
          awaitingClaim: false,
          moneyReveal: null,
          lastEffect: null,
          lastResultLabel: null,
          lastSliceId: null,
        }),
      });
      saveRunCheckpoint(restored);
      return { ok: true };
    }

    if (id === "bailout") {
      const rescued = payBailout(run);
      if (rescued == null) return { ok: false, reason: "Not enough chips" };
      set({
        run: rescued,
        preSpinSnapshot: null,
        ui: mergeUi(rescued, emptyUi, {
          activeWheelIndex: rescued.wheelIndex,
          scrollTarget: rescued.wheelIndex,
          showDesperationPick: false,
          desperationOffers: [],
          runEndFinalized: false,
          isSpinning: false,
          spinWheelIndex: null,
          awaitingClaim: false,
          moneyReveal: null,
        }),
      });
      saveRunCheckpoint(rescued);
      return { ok: true };
    }

    return { ok: false, reason: "Unknown tactic" };
  },

  dismissDesperationPick: () => {
    const { run } = get();
    if (run == null) return;
    finalizeRunEnd(run);
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

  continueAfterCycleReward: (pitId) => {
    cancelBossCycleRewardApply();
    const { run, ui } = get();
    if (!canDismissBossOverlay(run, ui.bossCyclePhase)) return;
    if (run!.runEffects?.alphaMilestonePending === true) return;
    if (run!.runEffects?.pitStopPending === true && pitId == null) return;

    let cleared = run!;
    if (pitId != null) {
      cleared = applyPitStopChoice(cleared, pitId);
    }

    const next = withTacticWheelIndices(
      normalizeRunState({
        ...cleared,
        phase: "active",
        runEffects: { ...cleared.runEffects, pitStopPending: false },
      })
    );
    set({
      run: next,
      preSpinSnapshot: null,
      ui: mergeUi(next, ui, {
        bossCyclePhase: "none",
        bossSliceEffect: null,
        activeWheelIndex: next.wheelIndex,
        scrollTarget: next.wheelIndex,
        awaitingClaim: false,
        isSpinning: false,
        spinWheelIndex: null,
        showCycleReward: false,
        shopPending: false,
        sliceEraseMode: false,
        gambleFlipActive: false,
        moneyReveal: null,
        chipReveal: null,
        showDesperationPick: false,
        desperationOffers: [],
      }),
    });
    saveRunCheckpoint(next);
    flushRunCheckpoint();
  },

  continueInfiniteAfterAlpha: () => {
    const { run, ui } = get();
    if (run == null || run.runEffects?.alphaMilestonePending !== true) return;
    const advanced = RunManager.enterInfiniteFloor({
      ...run,
      runEffects: {
        ...run.runEffects,
        alphaMilestonePending: false,
        pitStopPending: false,
      },
    });
    const next = withTacticWheelIndices(
      normalizeRunState({
        ...advanced,
        phase: "active",
      })
    );
    set({
      run: next,
      ui: mergeUi(next, ui, {
        activeWheelIndex: next.wheelIndex,
        scrollTarget: next.wheelIndex,
        showCycleReward: false,
        bossCyclePhase: "none",
        bossSliceEffect: null,
        awaitingClaim: false,
        isSpinning: false,
        spinWheelIndex: null,
        shopPending: false,
      }),
    });
    saveRunCheckpoint(next);
    flushRunCheckpoint();
  },

  endRunAfterAlpha: () => {
    const { run, ui } = get();
    if (run == null || run.runEffects?.alphaMilestonePending !== true) return;
    const next: RunState = {
      ...run,
      phase: "alpha_won",
      runEffects: {
        ...run.runEffects,
        alphaMilestonePending: false,
        pitStopPending: false,
      },
    };
    set({
      run: next,
      ui: { ...ui, showCycleReward: false, bossCyclePhase: "none", bossSliceEffect: null },
    });
    flushRunCheckpoint();
  },

  dismissCycleReward: () => {
    set((s) => ({ ui: { ...s.ui, showCycleReward: false } }));
  },

  commitMoneyReveal: () => {
    const { run, ui } = get();
    if (run == null || ui.moneyReveal == null) return;
    const next = applyPendingMoneyReveal(run, ui.moneyReveal);
    if (next.phase === "lost_money") {
      applyLossOrDesperation(next);
      return;
    }
    set({
      run: next,
      ui: { ...ui, moneyReveal: null },
    });
    saveRunCheckpoint(next);
  },

  commitChipReveal: () => {
    const { ui } = get();
    if (ui.chipReveal == null) return;
    set({ ui: { ...ui, chipReveal: null } });
  },
}));
