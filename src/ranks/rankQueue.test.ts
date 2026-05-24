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

import { createPendingSubmit, enqueueScoreSubmit, loadRankQueue } from "./rankQueue";

describe("rankQueue", () => {
  beforeEach(() => {
    store.clear();
  });

  it("queues and dedupes identical peak submissions", async () => {
    const a = createPendingSubmit({
      userId: "anon_testuser1",
      displayName: "Player",
      peakMoney: 5000,
      floor: 2,
    });
    await enqueueScoreSubmit(a);
    await enqueueScoreSubmit({ ...a, id: "sub_dup" });
    const q = await loadRankQueue();
    expect(q.pending).toHaveLength(1);
    expect(q.pending[0]?.peakMoney).toBe(5000);
  });
});
