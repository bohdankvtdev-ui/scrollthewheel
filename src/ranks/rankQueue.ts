import { STORAGE_KEYS } from "../persistence/keys";
import { loadProgress, saveProgress } from "../persistence/saveManager";
import { RANK_API } from "./rankConstants";
import type { PendingScoreSubmit, RankQueueState } from "./types";

const EMPTY_QUEUE: RankQueueState = { version: 1, pending: [] };

export async function loadRankQueue(): Promise<RankQueueState> {
  const stored = await loadProgress<RankQueueState>(STORAGE_KEYS.rankQueue);
  if (stored?.version === 1 && Array.isArray(stored.pending)) return stored;
  return { ...EMPTY_QUEUE };
}

export async function saveRankQueue(queue: RankQueueState): Promise<void> {
  await saveProgress(STORAGE_KEYS.rankQueue, queue);
}

export function createPendingSubmit(input: {
  userId: string;
  displayName: string;
  peakMoney: number;
  floor: number;
}): PendingScoreSubmit {
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId: input.userId,
    displayName: input.displayName,
    peakMoney: input.peakMoney,
    floor: input.floor,
    achievedAt: new Date().toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function enqueueScoreSubmit(item: PendingScoreSubmit): Promise<number> {
  const queue = await loadRankQueue();
  const withoutDup = queue.pending.filter(
    (p) => !(p.userId === item.userId && p.peakMoney === item.peakMoney)
  );
  const next = [item, ...withoutDup].slice(0, RANK_API.maxQueueItems);
  await saveRankQueue({ version: 1, pending: next });
  return next.length;
}

export async function dequeueScoreSubmit(id: string): Promise<void> {
  const queue = await loadRankQueue();
  const next = queue.pending.filter((p) => p.id !== id);
  await saveRankQueue({ version: 1, pending: next });
}

export async function bumpSubmitAttempt(id: string): Promise<void> {
  const queue = await loadRankQueue();
  const next = queue.pending.map((p) =>
    p.id === id ? { ...p, attempts: p.attempts + 1 } : p
  );
  await saveRankQueue({ version: 1, pending: next });
}

export async function dropExhaustedSubmits(): Promise<number> {
  const queue = await loadRankQueue();
  const next = queue.pending.filter((p) => p.attempts < RANK_API.maxSubmitAttempts);
  await saveRankQueue({ version: 1, pending: next });
  return next.length;
}
