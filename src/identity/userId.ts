import { STORAGE_KEYS } from "../persistence/keys";
import { loadProgress, saveProgress } from "../persistence/saveManager";

function createAnonymousUserId(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 11);
  return `anon_${stamp}_${rand}`;
}

/**
 * Anonymous identity — no registration. Created once on first app open.
 */
export async function getOrCreateUserId(): Promise<string> {
  const existing = await loadProgress<string>(STORAGE_KEYS.userId);
  if (existing != null && existing.length > 0) {
    return existing;
  }
  const userId = createAnonymousUserId();
  await saveProgress(STORAGE_KEYS.userId, userId);
  return userId;
}
