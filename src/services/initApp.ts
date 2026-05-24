import { Ads } from "../ads";
import { getOrCreateUserId } from "../identity/userId";
import { initRankService } from "../ranks";
import { initPersistence } from "../persistence/mmkv";
import { hydratePersistentUpgrades } from "../upgrades/persistentUpgrades";

export type AppInitSnapshot = {
  userId: string;
};

let initPromise: Promise<AppInitSnapshot> | null = null;

/**
 * One-shot cold start: disk, anonymous id, meta upgrades, ads SDK.
 */
export function initAppServices(): Promise<AppInitSnapshot> {
  if (initPromise != null) return initPromise;
  initPromise = (async () => {
    await initPersistence();
    const userId = await getOrCreateUserId();
    await Promise.all([hydratePersistentUpgrades(), Ads.initialize(), initRankService(userId)]);
    return { userId };
  })();
  return initPromise;
}
