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

import { getOrCreateUserId } from "./userId";
import { STORAGE_KEYS } from "../persistence/keys";

describe("getOrCreateUserId", () => {
  beforeEach(() => {
    store.clear();
  });

  it("creates and persists an anonymous id on first call", async () => {
    const first = await getOrCreateUserId();
    expect(first.startsWith("anon_")).toBe(true);
    const second = await getOrCreateUserId();
    expect(second).toBe(first);
    expect(store.has(STORAGE_KEYS.userId)).toBe(true);
  });
});
