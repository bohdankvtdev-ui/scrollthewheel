import { create } from "zustand";
import { DEFAULT_META, loadMeta, saveMeta, type MetaPersist } from "../persistence/mmkv";

function persistMeta(state: MetaPersist): void {
  saveMeta({
    version: state.version,
    bestFloor: state.bestFloor,
    totalRuns: state.totalRuns,
    totalChips: state.totalChips,
    unlockedRelics: state.unlockedRelics,
    settings: state.settings,
  });
}

type MetaStore = MetaPersist & {
  hydrated: boolean;
  hydrate: () => void;
  recordRunEnd: (floor: number) => void;
  grantChips: (amount: number) => number;
  setSetting: <K extends keyof MetaPersist["settings"]>(key: K, value: MetaPersist["settings"][K]) => void;
  unlockRelic: (relicId: string) => void;
};

export const useMetaStore = create<MetaStore>((set, get) => ({
  ...DEFAULT_META,
  hydrated: false,

  hydrate: () => {
    const meta = loadMeta();
    set({ ...meta, totalChips: meta.totalChips ?? 0, hydrated: true });
  },

  recordRunEnd: (floor) => {
    const state = get();
    const bestFloor = Math.max(state.bestFloor, floor);
    const next = {
      ...state,
      bestFloor,
      totalRuns: state.totalRuns + 1,
    };
    persistMeta(next);
    set({ bestFloor, totalRuns: next.totalRuns });
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
