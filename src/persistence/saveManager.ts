import AsyncStorage from "@react-native-async-storage/async-storage";

const PROGRESS_PREFIX = "spinwheel/progress/";

/** Keys with `/` are stored as-is (legacy meta, identity, etc.). */
function storageKey(key: string): string {
  return key.includes("/") ? key : `${PROGRESS_PREFIX}${key}`;
}

export async function saveProgress<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(storageKey(key), JSON.stringify(value));
}

export async function loadProgress<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(storageKey(key));
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Remove one logical key, or all keys under the progress prefix when `key` is omitted. */
export async function resetProgress(key?: string): Promise<void> {
  if (key != null) {
    await AsyncStorage.removeItem(storageKey(key));
    return;
  }
  const all = await AsyncStorage.getAllKeys();
  const prefixed = all.filter((k) => k.startsWith(PROGRESS_PREFIX));
  if (prefixed.length > 0) {
    await AsyncStorage.multiRemove(prefixed);
  }
}
