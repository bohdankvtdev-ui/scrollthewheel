export * from "./types";
export * from "./config";
export {
  initRankService,
  onRunEnded,
  flushPendingSubmits,
  refreshLeaderboardData,
  refreshConnectivity,
  setLeaderboardOptIn,
  saveDisplayName,
  setRankDisplayName,
  getRankUserId,
  syncWhenOnline,
  refreshRanksScreen,
  getLeaderboardEndpointHint,
  isLeaderboardConfigured,
} from "./RankService";
export type { SyncResult } from "./RankService";
