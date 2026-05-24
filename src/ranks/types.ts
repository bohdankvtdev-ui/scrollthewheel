export type RankRow = {
  rank: number;
  userId: string;
  displayName: string;
  peakMoney: number;
  floor: number;
  achievedAt: string;
  isSelf?: boolean;
};

export type RankPrefs = {
  version: 1;
  /** Player opted in to global leaderboard (Temple Run / Subway style). */
  leaderboardOptIn: boolean;
  displayName: string;
  /** Last peak bank successfully synced to cloud. */
  lastSyncedPeakMoney: number;
  /** Best peak bank seen locally (offline-safe). */
  localBestPeakMoney: number;
};

export type PendingScoreSubmit = {
  id: string;
  userId: string;
  displayName: string;
  peakMoney: number;
  floor: number;
  achievedAt: string;
  attempts: number;
  createdAt: string;
};

export type RankQueueState = {
  version: 1;
  pending: PendingScoreSubmit[];
};

export type LeaderboardApiResponse = {
  updatedAt: string;
  totalPlayers: number;
  entries: RankRow[];
};

export type MyRankApiResponse = {
  registered: boolean;
  rank: number | null;
  inTop100: boolean;
  displayName: string;
  peakMoney: number;
  floor: number;
  achievedAt: string;
  totalPlayers: number;
};

export type SubmitApiResponse =
  | {
      accepted: true;
      improved?: boolean;
      nameUpdated?: boolean;
      peakMoney: number;
      rank: number | null;
      inTop100: boolean;
    }
  | { accepted: false; reason: string };

export type ConnectivityState = "unknown" | "online" | "offline";
