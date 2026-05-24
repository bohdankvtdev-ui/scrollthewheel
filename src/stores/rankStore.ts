import { create } from "zustand";
import type { ConnectivityState, RankPrefs, RankRow } from "../ranks/types";

export type MyRankSnapshot = {
  registered: boolean;
  rank: number | null;
  inTop100: boolean;
  peakMoney: number;
  displayName: string;
  totalPlayers: number;
};

export type RunSubmitStatus = "idle" | "queued" | "synced" | "failed";

type RankStore = {
  hydrated: boolean;
  configured: boolean;
  connectivity: ConnectivityState;
  loading: boolean;
  syncing: boolean;
  prefs: RankPrefs;
  entries: RankRow[];
  boardUpdatedAt: string | null;
  totalPlayers: number;
  myRank: MyRankSnapshot | null;
  pendingCount: number;
  lastRunSubmitStatus: RunSubmitStatus;
  /** Short UI toast on ranks screen (save, sync, errors). */
  banner: { type: "info" | "success" | "error"; text: string } | null;
  applyPrefs: (prefs: RankPrefs) => void;
  setConfigured: (v: boolean) => void;
  setConnectivity: (s: ConnectivityState) => void;
  setLoading: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setEntries: (rows: RankRow[], updatedAt: string, totalPlayers: number) => void;
  setMyRank: (snap: MyRankSnapshot) => void;
  setPendingCount: (n: number) => void;
  setLastRunSubmitStatus: (s: RunSubmitStatus) => void;
  setBanner: (banner: { type: "info" | "success" | "error"; text: string } | null) => void;
  clearBanner: () => void;
  markHydrated: () => void;
};

export const useRankStore = create<RankStore>((set) => ({
  hydrated: false,
  configured: false,
  connectivity: "unknown",
  loading: false,
  syncing: false,
  prefs: {
    version: 1,
    leaderboardOptIn: false,
    displayName: "",
    lastSyncedPeakMoney: 0,
    localBestPeakMoney: 0,
  },
  entries: [],
  boardUpdatedAt: null,
  totalPlayers: 0,
  myRank: null,
  pendingCount: 0,
  lastRunSubmitStatus: "idle",
  banner: null,

  applyPrefs: (prefs) => set({ prefs, hydrated: true }),
  setConfigured: (configured) => set({ configured }),
  setConnectivity: (connectivity) => set({ connectivity }),
  setLoading: (loading) => set({ loading }),
  setSyncing: (syncing) => set({ syncing }),
  setEntries: (entries, boardUpdatedAt, totalPlayers) =>
    set({ entries, boardUpdatedAt, totalPlayers }),
  setMyRank: (myRank) => set({ myRank }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastRunSubmitStatus: (lastRunSubmitStatus) => set({ lastRunSubmitStatus }),
  setBanner: (banner) => set({ banner }),
  clearBanner: () => set({ banner: null }),
  markHydrated: () => set({ hydrated: true }),
}));
