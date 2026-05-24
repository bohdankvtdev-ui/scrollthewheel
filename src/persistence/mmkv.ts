/**
 * Run persistence — AsyncStorage backend (Expo Go compatible).
 * MMKV/Nitro is not available in Expo Go; swap to createMMKV when using dev builds.
 */
import { MMKV_KEYS } from "./keys";
import { loadProgress, resetProgress, saveProgress } from "./saveManager";
import type { RunState } from "../schemas";
import { RUN_SCHEMA_VERSION } from "../schemas";

export type MetaPersist = {
  version: number;
  bestFloor: number;
  totalRuns: number;
  /** Global meta score (chips) — persists across runs. */
  totalChips: number;
  /** Highest bank $ reached in any run. */
  bestPeakMoney: number;
  unlockedRelics: string[];
  settings: {
    haptics: boolean;
    reducedMotion: boolean;
  };
};

export const DEFAULT_META: MetaPersist = {
  version: RUN_SCHEMA_VERSION,
  bestFloor: 0,
  totalRuns: 0,
  totalChips: 0,
  bestPeakMoney: 0,
  unlockedRelics: [],
  settings: { haptics: true, reducedMotion: false },
};

let metaCache: MetaPersist = { ...DEFAULT_META };
let runCache: RunState | null = null;
let initPromise: Promise<void> | null = null;

/** Debounce disk writes during rapid spin/shop updates; memory cache stays synchronous. */
/** Longer debounce — fewer full-run JSON.stringify passes during rapid play. */
const CHECKPOINT_DEBOUNCE_MS = 1500;
let checkpointTimer: ReturnType<typeof setTimeout> | null = null;

async function readMetaFromDisk(): Promise<MetaPersist> {
  const stored = await loadProgress<MetaPersist>(MMKV_KEYS.meta);
  return stored != null ? { ...DEFAULT_META, ...stored } : { ...DEFAULT_META };
}

async function readRunFromDisk(): Promise<RunState | null> {
  return loadProgress<RunState>(MMKV_KEYS.runCheckpoint);
}

/** Load meta + run checkpoint from disk into memory. Call once before reading. */
export function initPersistence(): Promise<void> {
  if (initPromise != null) return initPromise;
  initPromise = (async () => {
    const [meta, run] = await Promise.all([readMetaFromDisk(), readRunFromDisk()]);
    metaCache = meta;
    runCache = run;
  })();
  return initPromise;
}

/** Sync read from in-memory cache (call after `initPersistence`). */
export function loadMeta(): MetaPersist {
  return metaCache;
}

export function saveMeta(meta: MetaPersist): void {
  metaCache = meta;
  void saveProgress(MMKV_KEYS.meta, meta);
}

export function loadRunCheckpoint(): RunState | null {
  return runCache;
}

function writeRunCheckpointToDisk(run: RunState | null): void {
  if (run == null) {
    void resetProgress(MMKV_KEYS.runCheckpoint);
    return;
  }
  void saveProgress(MMKV_KEYS.runCheckpoint, run);
}

/** Persist run checkpoint immediately (e.g. app background / unmount). */
export function flushRunCheckpoint(): void {
  if (checkpointTimer != null) {
    clearTimeout(checkpointTimer);
    checkpointTimer = null;
  }
  writeRunCheckpointToDisk(runCache);
}

export function saveRunCheckpoint(run: RunState | null): void {
  runCache = run;
  if (checkpointTimer != null) {
    clearTimeout(checkpointTimer);
    checkpointTimer = null;
  }
  if (run == null) {
    writeRunCheckpointToDisk(null);
    return;
  }
  checkpointTimer = setTimeout(() => {
    checkpointTimer = null;
    writeRunCheckpointToDisk(runCache);
  }, CHECKPOINT_DEBOUNCE_MS);
}
