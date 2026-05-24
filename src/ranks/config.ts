import Constants from "expo-constants";

function firstNonEmpty(...values: (string | undefined)[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

export type LeaderboardConfigSource = "env" | "extra" | null;

/** Prefer EXPO_PUBLIC_* so `.env` overrides app.json dev defaults. */
export function resolveLeaderboardApiBase(): {
  base: string | null;
  source: LeaderboardConfigSource;
} {
  const fromEnv = process.env.EXPO_PUBLIC_LEADERBOARD_API_URL;
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra =
    typeof extra?.leaderboardApiUrl === "string" ? extra.leaderboardApiUrl : undefined;

  const raw = firstNonEmpty(fromEnv, fromExtra);
  if (raw == null) return { base: null, source: null };
  const source: LeaderboardConfigSource = fromEnv != null && fromEnv.trim().length > 0 ? "env" : "extra";
  return { base: raw.replace(/\/$/, ""), source };
}

export function getLeaderboardApiBase(): string | null {
  return resolveLeaderboardApiBase().base;
}

export function getLeaderboardSubmitKey(): string | null {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  return firstNonEmpty(
    process.env.EXPO_PUBLIC_LEADERBOARD_SUBMIT_KEY,
    typeof extra?.leaderboardSubmitKey === "string" ? extra.leaderboardSubmitKey : undefined
  );
}

export function isLocalhostLeaderboardUrl(base: string | null): boolean {
  if (base == null) return false;
  try {
    const host = new URL(base).hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

export function describeLeaderboardHost(base: string | null): string {
  if (base == null) return "not set";
  try {
    return new URL(base).host;
  } catch {
    return base.slice(0, 32);
  }
}

export { RANK_API } from "./rankConstants";
