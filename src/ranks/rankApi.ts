import { getLeaderboardApiBase, getLeaderboardSubmitKey, RANK_API } from "./config";
import type {
  LeaderboardApiResponse,
  MyRankApiResponse,
  SubmitApiResponse,
} from "./types";

export type RankFetchError = {
  kind: "offline" | "timeout" | "http" | "config";
  message: string;
};

async function fetchJson<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: RankFetchError }> {
  const base = getLeaderboardApiBase();
  if (base == null) {
    return { ok: false, error: { kind: "config", message: "Leaderboard API not configured" } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RANK_API.requestTimeoutMs);

  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      let detail = `Server error (${res.status})`;
      try {
        const errBody = (await res.json()) as { error?: string; code?: string };
        if (errBody.code === "unauthorized") {
          detail = "Submit key rejected — check EXPO_PUBLIC_LEADERBOARD_SUBMIT_KEY";
        } else if (typeof errBody.error === "string" && errBody.error.length > 0) {
          detail = errBody.error;
        }
      } catch {
        /* ignore parse errors */
      }
      return {
        ok: false,
        error: { kind: "http", message: detail },
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: {
        kind: aborted ? "timeout" : "offline",
        message: aborted ? "Request timed out" : "No connection",
      },
    };
  }
}

export async function pingLeaderboardApi(): Promise<boolean> {
  const result = await fetchJson<{ ok: boolean }>(RANK_API.healthPath);
  return result.ok && result.data.ok === true;
}

export async function fetchLeaderboard(limit = 50) {
  return fetchJson<LeaderboardApiResponse>(`${RANK_API.boardPath}?limit=${limit}`);
}

export async function fetchMyRank(userId: string) {
  const q = encodeURIComponent(userId);
  return fetchJson<MyRankApiResponse>(`${RANK_API.mePath}?userId=${q}`);
}

export async function submitPeakMoney(input: {
  userId: string;
  displayName: string;
  peakMoney: number;
  floor: number;
  achievedAt: string;
  clientVersion?: string;
}) {
  const submitKey = getLeaderboardSubmitKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (submitKey != null) headers["X-Submit-Key"] = submitKey;

  return fetchJson<SubmitApiResponse>(RANK_API.submitPath, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
}
