export const RANK_API = {
  healthPath: "/v1/health",
  boardPath: "/v1/leaderboard",
  mePath: "/v1/leaderboard/me",
  submitPath: "/v1/leaderboard/submit",
  requestTimeoutMs: 12_000,
  maxQueueItems: 8,
  maxSubmitAttempts: 12,
} as const;
