import { AppState, type AppStateStatus } from "react-native";
import {
  fetchLeaderboard,
  fetchMyRank,
  pingLeaderboardApi,
  submitPeakMoney,
} from "./rankApi";
import {
  getLeaderboardApiBase,
  isLocalhostLeaderboardUrl,
  resolveLeaderboardApiBase,
} from "./config";
import {
  bumpSubmitAttempt,
  createPendingSubmit,
  dequeueScoreSubmit,
  dropExhaustedSubmits,
  enqueueScoreSubmit,
  loadRankQueue,
} from "./rankQueue";
import {
  defaultDisplayName,
  getRankPrefs,
  hydrateRankPrefs,
  patchRankPrefs,
} from "./rankPrefs";
import type { ConnectivityState, RankRow } from "./types";
import { loadMeta } from "../persistence/mmkv";
import { useRankStore } from "../stores/rankStore";

let userIdRef: string | null = null;
let appStateSub: { remove: () => void } | null = null;
let flushInFlight: Promise<void> | null = null;
let lastConnectivity: ConnectivityState = "unknown";
let lastAutoSyncAt = 0;

const AUTO_SYNC_COOLDOWN_MS = 60_000;

export function isLeaderboardConfigured(): boolean {
  return getLeaderboardApiBase() != null;
}

export async function initRankService(userId: string): Promise<void> {
  userIdRef = userId;
  await hydrateRankPrefs();
  const meta = loadMeta();
  let prefs = getRankPrefs();
  if (meta.bestPeakMoney > prefs.localBestPeakMoney) {
    prefs = await patchRankPrefs({ localBestPeakMoney: meta.bestPeakMoney });
  }
  useRankStore.getState().applyPrefs(prefs);
  useRankStore.getState().setConfigured(isLeaderboardConfigured());

  if (appStateSub == null) {
    appStateSub = AppState.addEventListener("change", onAppStateChange);
  }

  await refreshConnectivity();
  if (prefs.leaderboardOptIn) {
    void syncWhenOnline({ silent: true });
  }
}

function onAppStateChange(next: AppStateStatus): void {
  if (next !== "active") return;
  void refreshConnectivity().then((state) => {
    if (state === "online") void syncWhenOnline();
  });
}

export async function refreshConnectivity(): Promise<ConnectivityState> {
  if (!isLeaderboardConfigured()) {
    useRankStore.getState().setConnectivity("offline");
    lastConnectivity = "offline";
    return "offline";
  }
  useRankStore.getState().setConnectivity("unknown");
  const online = await pingLeaderboardApi();
  const state: ConnectivityState = online ? "online" : "offline";
  const wasOffline = lastConnectivity !== "online";
  lastConnectivity = state;
  useRankStore.getState().setConnectivity(state);
  if (state === "online" && wasOffline && getRankPrefs().leaderboardOptIn) {
    void syncWhenOnline({ silent: true });
  }
  return state;
}

async function ensurePendingBestScoreQueued(): Promise<void> {
  if (userIdRef == null) return;
  const prefs = getRankPrefs();
  if (!prefs.leaderboardOptIn) return;

  const peakMoney = Math.max(prefs.localBestPeakMoney, prefs.lastSyncedPeakMoney);
  if (peakMoney <= prefs.lastSyncedPeakMoney) return;

  const queue = await loadRankQueue();
  const alreadyQueued = queue.pending.some((p) => p.peakMoney >= peakMoney);
  if (alreadyQueued) return;

  const uid = userIdRef;
  const displayName =
    prefs.displayName.trim().length > 0 ? prefs.displayName.trim() : defaultDisplayName(uid);
  const count = await enqueueScoreSubmit(
    createPendingSubmit({
      userId: uid,
      displayName,
      peakMoney,
      floor: 1,
    })
  );
  useRankStore.getState().setPendingCount(count);
}

/**
 * Flush queue + refresh board when online (debounced). Call on home focus, app resume, etc.
 */
export type SyncResult = {
  ok: boolean;
  message: string;
};

export async function syncWhenOnline(opts?: { force?: boolean; silent?: boolean }): Promise<SyncResult> {
  const silent = opts?.silent === true;
  const prefs = getRankPrefs();
  if (!prefs.leaderboardOptIn) {
    return silent ? { ok: true, message: "" } : { ok: false, message: "Turn on global ranks to sync." };
  }
  if (!isLeaderboardConfigured() || userIdRef == null) {
    return silent ? { ok: true, message: "" } : { ok: false, message: "Leaderboard API not configured in this build." };
  }
  if (isLocalhostLeaderboardUrl(getLeaderboardApiBase())) {
    return silent
      ? { ok: true, message: "" }
      : {
          ok: false,
          message: "API is localhost — use your Workers URL in .env, then restart Expo.",
        };
  }

  const now = Date.now();
  if (!opts?.force && now - lastAutoSyncAt < AUTO_SYNC_COOLDOWN_MS) {
    return { ok: true, message: "" };
  }

  const online = await refreshConnectivity();
  if (online !== "online") {
    return silent ? { ok: true, message: "" } : { ok: false, message: "Offline — scores stay queued until you're online." };
  }

  lastAutoSyncAt = now;
  await ensurePendingBestScoreQueued();
  await flushPendingSubmits();
  await refreshLeaderboardData();

  const pending = useRankStore.getState().pendingCount;
  if (pending > 0 && !silent) {
    return { ok: false, message: `${pending} score(s) still waiting to upload.` };
  }
  return { ok: true, message: silent ? "" : "Leaderboard synced." };
}

/** One refresh when opening the ranks screen (no duplicate home/init sync noise). */
export async function refreshRanksScreen(): Promise<void> {
  if (!getRankPrefs().leaderboardOptIn) {
    await refreshLeaderboardData();
    return;
  }
  await syncWhenOnline({ force: true, silent: true });
}

export function getLeaderboardEndpointHint(): string {
  const { base, source } = resolveLeaderboardApiBase();
  if (base == null) return "API not set";
  const host = base.replace(/^https?:\/\//, "").split("/")[0];
  const tag = source === "env" ? "" : " (app.json)";
  return `${host}${tag}`;
}

export async function setLeaderboardOptIn(optIn: boolean): Promise<void> {
  const prefs = await patchRankPrefs({ leaderboardOptIn: optIn });
  useRankStore.getState().applyPrefs(prefs);
  if (optIn) {
    await syncWhenOnline({ force: true, silent: true });
  }
}

export function getRankUserId(): string | null {
  return userIdRef;
}

export async function saveDisplayName(rawName: string): Promise<{ ok: boolean; message: string }> {
  if (userIdRef == null) {
    return { ok: false, message: "App still starting — try again." };
  }

  const uid = userIdRef;
  const trimmed = rawName.trim().slice(0, 20);
  const displayName = trimmed.length > 0 ? trimmed : defaultDisplayName(uid);
  const prefs = await patchRankPrefs({ displayName });
  useRankStore.getState().applyPrefs(prefs);

  if (!prefs.leaderboardOptIn) {
    return { ok: true, message: "Name saved on this device." };
  }

  if (!isLeaderboardConfigured()) {
    return { ok: true, message: "Name saved — leaderboard URL not set in this build." };
  }

  const peakMoney = Math.max(prefs.localBestPeakMoney, prefs.lastSyncedPeakMoney, 0);
  const floor = 1;

  if (isLocalhostLeaderboardUrl(getLeaderboardApiBase())) {
    return {
      ok: false,
      message: "API points to localhost — set EXPO_PUBLIC_LEADERBOARD_API_URL in .env and restart Expo.",
    };
  }
  const online = await refreshConnectivity();
  if (online !== "online") {
    const pending = createPendingSubmit({
      userId: uid,
      displayName,
      peakMoney,
      floor,
    });
    const count = await enqueueScoreSubmit(pending);
    useRankStore.getState().setPendingCount(count);
    return { ok: true, message: "Name saved — will sync when you're online." };
  }

  useRankStore.getState().setSyncing(true);
  const result = await submitPeakMoney({
    userId: uid,
    displayName,
    peakMoney,
    floor,
    achievedAt: new Date().toISOString(),
  });
  useRankStore.getState().setSyncing(false);

  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error.kind === "offline"
          ? "Offline — name saved locally."
          : result.error.message,
    };
  }

  if (result.data.accepted) {
    await patchRankPrefs({
      lastSyncedPeakMoney: Math.max(getRankPrefs().lastSyncedPeakMoney, result.data.peakMoney),
    });
    useRankStore.getState().applyPrefs(getRankPrefs());
    await refreshLeaderboardData();
    if (result.data.nameUpdated) {
      return { ok: true, message: "Name updated on the leaderboard." };
    }
    return { ok: true, message: "Saved and synced to global ranks." };
  }

  return { ok: true, message: "Name saved on this device." };
}

/** @deprecated Use saveDisplayName — returns user feedback. */
export async function setRankDisplayName(name: string): Promise<void> {
  await saveDisplayName(name);
}

/**
 * Called when a run ends — updates local best; queues cloud submit if opted in.
 * Safe offline: always persists locally first.
 */
export async function onRunEnded(stats: { peakMoney: number; floor: number }): Promise<void> {
  const peakMoney = Math.max(0, Math.floor(stats.peakMoney));
  const floor = Math.max(1, Math.floor(stats.floor));
  const prefs = getRankPrefs();
  const localBest = Math.max(prefs.localBestPeakMoney, peakMoney);
  const improved = peakMoney > prefs.localBestPeakMoney;

  const nextPrefs = await patchRankPrefs({
    localBestPeakMoney: localBest,
  });
  useRankStore.getState().applyPrefs(nextPrefs);

  if (!prefs.leaderboardOptIn || !isLeaderboardConfigured() || userIdRef == null) {
    return;
  }

  const synced = getRankPrefs().lastSyncedPeakMoney;
  if (localBest <= synced) {
    return;
  }

  const uid = userIdRef;
  const displayName =
    prefs.displayName.trim().length > 0 ? prefs.displayName.trim() : defaultDisplayName(uid);

  const pending = createPendingSubmit({
    userId: uid,
    displayName,
    peakMoney: localBest,
    floor,
  });
  const count = await enqueueScoreSubmit(pending);
  useRankStore.getState().setPendingCount(count);

  if (improved) {
    useRankStore.getState().setLastRunSubmitStatus("queued");
  }

  if (improved || peakMoney > prefs.lastSyncedPeakMoney) {
    void syncWhenOnline({ force: true, silent: true });
  }
}

export async function flushPendingSubmits(): Promise<void> {
  if (flushInFlight != null) return flushInFlight;
  flushInFlight = flushPendingSubmitsInner().finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
}

async function flushPendingSubmitsInner(): Promise<void> {
  if (!isLeaderboardConfigured() || userIdRef == null) return;
  const online = await refreshConnectivity();
  if (online !== "online") return;

  const queue = await loadRankQueue();
  if (queue.pending.length === 0) {
    useRankStore.getState().setPendingCount(0);
    return;
  }

  useRankStore.getState().setSyncing(true);
  let lastStatus: "synced" | "queued" | "failed" = "queued";

  for (const item of queue.pending) {
    const result = await submitPeakMoney({
      userId: item.userId,
      displayName: item.displayName,
      peakMoney: item.peakMoney,
      floor: item.floor,
      achievedAt: item.achievedAt,
    });

    if (!result.ok) {
      await bumpSubmitAttempt(item.id);
      lastStatus = "failed";
      if (result.error.kind === "offline" || result.error.kind === "timeout") break;
      continue;
    }

    if (result.data.accepted) {
      await dequeueScoreSubmit(item.id);
      const prefs = await patchRankPrefs({
        lastSyncedPeakMoney: Math.max(getRankPrefs().lastSyncedPeakMoney, item.peakMoney),
      });
      useRankStore.getState().applyPrefs(prefs);
      lastStatus = "synced";
    } else if (result.data.reason === "not_improved") {
      await dequeueScoreSubmit(item.id);
      const prefs = await patchRankPrefs({
        lastSyncedPeakMoney: Math.max(getRankPrefs().lastSyncedPeakMoney, item.peakMoney),
      });
      useRankStore.getState().applyPrefs(prefs);
    } else {
      await bumpSubmitAttempt(item.id);
    }
  }

  await dropExhaustedSubmits();
  const remaining = (await loadRankQueue()).pending.length;
  useRankStore.getState().setPendingCount(remaining);
  useRankStore.getState().setSyncing(false);
  useRankStore.getState().setLastRunSubmitStatus(remaining > 0 ? lastStatus : "synced");

  if (getRankPrefs().leaderboardOptIn) {
    await refreshLeaderboardData();
  }
}

export async function refreshLeaderboardData(): Promise<void> {
  if (!isLeaderboardConfigured() || userIdRef == null) return;

  useRankStore.getState().setLoading(true);
  const online = await refreshConnectivity();
  if (online !== "online") {
    useRankStore.getState().setLoading(false);
    return;
  }

  const uid = userIdRef;
  const [board, me] = await Promise.all([fetchLeaderboard(50), fetchMyRank(uid)]);

  if (board.ok) {
    const rows: RankRow[] = board.data.entries.map((e) => ({
      ...e,
      isSelf: e.userId === uid,
    }));
    useRankStore.getState().setEntries(rows, board.data.updatedAt, board.data.totalPlayers);
  }

  if (me.ok) {
    useRankStore.getState().setMyRank({
      registered: me.data.registered,
      rank: me.data.rank,
      inTop100: me.data.inTop100,
      peakMoney: me.data.peakMoney,
      displayName: me.data.displayName,
      totalPlayers: me.data.totalPlayers,
    });
  }

  useRankStore.getState().setLoading(false);
}
