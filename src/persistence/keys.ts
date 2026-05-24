export const MMKV_KEYS = {
  meta: "roguelike/meta/v1",
  runCheckpoint: "roguelike/run/checkpoint/v1",
} as const;

export const STORAGE_KEYS = {
  userId: "app/identity/user_id/v1",
  persistentUpgrades: "spinwheel/upgrades/v1",
  rankPrefs: "spinwheel/rank/prefs/v1",
  rankQueue: "spinwheel/rank/queue/v1",
  ...MMKV_KEYS,
} as const;
