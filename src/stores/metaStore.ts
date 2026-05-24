import { create } from "zustand";
import { onRunEnded as recordRankOnRunEnd } from "../ranks";
import { DEFAULT_META, loadMeta, saveMeta, type MetaPersist } from "../persistence/mmkv";

function persistMeta(state: MetaPersist): void {
  saveMeta({
    version: state.version,
    bestFloor: state.bestFloor,
    totalRuns: state.totalRuns,
    totalChips: state.totalChips,
    bestPeakMoney: state.bestPeakMoney ?? 0,
    unlockedRelics: state.unlockedRelics,
    settings: state.settings,
  });
}

export type RunEndStats = {
  floor: number;
  peakMoney?: number;
};

type MetaStore = MetaPersist & {
  hydrated: boolean;
  hydrate: () => void;
  recordRunEnd: (stats: number | RunEndStats) => void;
  grantChips: (amount: number) => number;
  setSetting: <K extends keyof MetaPersist["settings"]>(key: K, value: MetaPersist["settings"][K]) => void;
  unlockRelic: (relicId: string) => void;
};

export const useMetaStore = create<MetaStore>((set, get) => ({
  ...DEFAULT_META,
  hydrated: false,

  hydrate: () => {
    const meta = loadMeta();
    set({
      ...meta,
      totalChips: meta.totalChips ?? 0,
      bestPeakMoney: meta.bestPeakMoney ?? 0,
      hydrated: true,
    });
  },

  recordRunEnd: (stats) => {
    const state = get();
    const floor = typeof stats === "number" ? stats : stats.floor;
    const peakMoney = typeof stats === "number" ? 0 : (stats.peakMoney ?? 0);
    const bestFloor = Math.max(state.bestFloor, floor);
    const bestPeakMoney = Math.max(state.bestPeakMoney ?? 0, peakMoney);
    const next = {
      ...state,
      bestFloor,
      bestPeakMoney,
      totalRuns: state.totalRuns + 1,
    };
    persistMeta(next);
    set({
      bestFloor,
      bestPeakMoney,
      totalRuns: next.totalRuns,
    });
    void recordRankOnRunEnd({ peakMoney, floor });
  },

  grantChips: (amount) => {
    const state = get();
    const totalChips = Math.max(0, state.totalChips + amount);
    const next = { ...state, totalChips };
    persistMeta(next);
    set({ totalChips });
    return totalChips;
  },

  setSetting: (key, value) => {
    const state = get();
    const next = { ...state, settings: { ...state.settings, [key]: value } };
    persistMeta(next);
    set({ settings: next.settings });
  },

  unlockRelic: (relicId) => {
    const state = get();
    if (state.unlockedRelics.includes(relicId)) return;
    const next = { ...state, unlockedRelics: [...state.unlockedRelics, relicId] };
    persistMeta(next);
    set({ unlockedRelics: next.unlockedRelics });
  },
}));
