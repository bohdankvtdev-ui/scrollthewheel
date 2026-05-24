import { STORAGE_KEYS } from "../persistence/keys";
import { loadProgress, saveProgress } from "../persistence/saveManager";

export type PersistentUpgradeId = string;

export type PersistentUpgradesState = {
  version: 1;
  /** Meta shop tree perks purchased with global chips */
  unlockedPerkIds: PersistentUpgradeId[];
  /** Optional numeric levels keyed by upgrade id */
  levels: Record<PersistentUpgradeId, number>;
};

export const DEFAULT_UPGRADES: PersistentUpgradesState = {
  version: 1,
  unlockedPerkIds: [],
  levels: {},
};

let cache: PersistentUpgradesState = { ...DEFAULT_UPGRADES };
let hydrated = false;

export async function hydratePersistentUpgrades(): Promise<PersistentUpgradesState> {
  const stored = await loadProgress<PersistentUpgradesState>(STORAGE_KEYS.persistentUpgrades);
  cache = stored != null ? { ...DEFAULT_UPGRADES, ...stored } : { ...DEFAULT_UPGRADES };
  hydrated = true;
  return cache;
}

export function getPersistentUpgrades(): PersistentUpgradesState {
  return cache;
}

export function isUpgradeUnlocked(id: PersistentUpgradeId): boolean {
  return cache.unlockedPerkIds.includes(id);
}

export async function unlockPersistentUpgrade(id: PersistentUpgradeId): Promise<PersistentUpgradesState> {
  if (!hydrated) await hydratePersistentUpgrades();
  if (cache.unlockedPerkIds.includes(id)) return cache;
  cache = { ...cache, unlockedPerkIds: [...cache.unlockedPerkIds, id] };
  await saveProgress(STORAGE_KEYS.persistentUpgrades, cache);
  return cache;
}

export async function setUpgradeLevel(
  id: PersistentUpgradeId,
  level: number
): Promise<PersistentUpgradesState> {
  if (!hydrated) await hydratePersistentUpgrades();
  cache = {
    ...cache,
    levels: { ...cache.levels, [id]: Math.max(0, level) },
  };
  await saveProgress(STORAGE_KEYS.persistentUpgrades, cache);
  return cache;
}

export async function resetPersistentUpgrades(): Promise<void> {
  cache = { ...DEFAULT_UPGRADES };
  hydrated = true;
  await saveProgress(STORAGE_KEYS.persistentUpgrades, cache);
}
