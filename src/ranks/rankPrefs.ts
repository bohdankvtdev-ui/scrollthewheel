import { STORAGE_KEYS } from "../persistence/keys";
import { loadProgress, saveProgress } from "../persistence/saveManager";
import type { RankPrefs } from "./types";

export const DEFAULT_RANK_PREFS: RankPrefs = {
  version: 1,
  leaderboardOptIn: false,
  displayName: "",
  lastSyncedPeakMoney: 0,
  localBestPeakMoney: 0,
};

let cache: RankPrefs = { ...DEFAULT_RANK_PREFS };
let hydrated = false;

export async function hydrateRankPrefs(): Promise<RankPrefs> {
  const stored = await loadProgress<RankPrefs>(STORAGE_KEYS.rankPrefs);
  cache = stored != null ? { ...DEFAULT_RANK_PREFS, ...stored } : { ...DEFAULT_RANK_PREFS };
  hydrated = true;
  return cache;
}

export function getRankPrefs(): RankPrefs {
  return cache;
}

export async function patchRankPrefs(patch: Partial<RankPrefs>): Promise<RankPrefs> {
  if (!hydrated) await hydrateRankPrefs();
  cache = { ...cache, ...patch, version: 1 };
  await saveProgress(STORAGE_KEYS.rankPrefs, cache);
  return cache;
}

export function defaultDisplayName(userId: string): string {
  return `Player${userId.slice(-4)}`;
}
