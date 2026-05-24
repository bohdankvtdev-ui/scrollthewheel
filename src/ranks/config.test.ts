import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        leaderboardApiUrl: "http://127.0.0.1:8787",
        leaderboardSubmitKey: "from-extra",
      },
    },
  },
}));

describe("leaderboard config", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_LEADERBOARD_API_URL;
    delete process.env.EXPO_PUBLIC_LEADERBOARD_SUBMIT_KEY;
    vi.resetModules();
  });

  it("prefers EXPO_PUBLIC_LEADERBOARD_API_URL over app.json extra", async () => {
    vi.resetModules();
    process.env.EXPO_PUBLIC_LEADERBOARD_API_URL = "https://prod.example.workers.dev";
    const { resolveLeaderboardApiBase, getLeaderboardApiBase } = await import("./config");
    expect(resolveLeaderboardApiBase()).toEqual({
      base: "https://prod.example.workers.dev",
      source: "env",
    });
    expect(getLeaderboardApiBase()).toBe("https://prod.example.workers.dev");
  });

  it("prefers EXPO_PUBLIC_LEADERBOARD_SUBMIT_KEY over app.json extra", async () => {
    vi.resetModules();
    process.env.EXPO_PUBLIC_LEADERBOARD_SUBMIT_KEY = "from-env";
    const { getLeaderboardSubmitKey } = await import("./config");
    expect(getLeaderboardSubmitKey()).toBe("from-env");
  });
});
