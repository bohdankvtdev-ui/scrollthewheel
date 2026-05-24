import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(async () => [...store.keys()]),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const key of keys) store.delete(key);
    }),
  },
}));

import { loadProgress, resetProgress, saveProgress } from "./saveManager";

describe("saveManager", () => {
  beforeEach(() => {
    store.clear();
  });

  it("round-trips JSON values under the progress prefix", async () => {
    await saveProgress("test-key", { score: 42, tags: ["a"] });
    const loaded = await loadProgress<{ score: number; tags: string[] }>("test-key");
    expect(loaded).toEqual({ score: 42, tags: ["a"] });
  });

  it("stores slash keys as full paths", async () => {
    await saveProgress("legacy/meta/v1", { ok: true });
    expect(store.has("legacy/meta/v1")).toBe(true);
    const loaded = await loadProgress<{ ok: boolean }>("legacy/meta/v1");
    expect(loaded?.ok).toBe(true);
  });

  it("resetProgress clears one key or all prefixed keys", async () => {
    await saveProgress("a", 1);
    await saveProgress("b", 2);
    await resetProgress("a");
    expect(await loadProgress("a")).toBeNull();
    expect(await loadProgress("b")).toEqual(2);
    await resetProgress();
    expect(await loadProgress("b")).toBeNull();
  });
});
