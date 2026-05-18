import { useEffect, useState } from "react";
import { initPersistence, loadRunCheckpoint } from "../persistence/mmkv";
import { useMetaStore } from "../stores/metaStore";
import type { RunState } from "../schemas";
import { normalizeRunState } from "../game/runState";
import { WHEEL_DATABASE_REVISION } from "../game/wheels/database/wheelDatabase";
import { rebuildWheelsFromDatabase } from "../systems/WheelSystem";
import { useRunStore } from "../stores/runStore";

function migrateRunCheckpoint(raw: RunState): RunState {
  const legacy = raw as RunState & { corruption?: number };
  let next = raw;
  if (legacy.corruption != null) {
    const { corruption: _removed, ...rest } = legacy;
    next = rest as RunState;
  }
  if (next.shields == null) next = { ...next, shields: 0 };
  if ("boss" in (next as RunState & { boss?: unknown })) {
    const { boss: _b, ...rest } = next as RunState & { boss?: unknown };
    next = rest as RunState;
  }
  if (next.pendingWheelRebuild == null) next = { ...next, pendingWheelRebuild: false };
  if (next.peakMoney == null) {
    next = { ...next, peakMoney: next.money ?? 0 };
  }
  if (next.floorsCleared == null) {
    next = { ...next, floorsCleared: Math.max(0, next.floor - 1) };
  }
  if (next.wheelDbRevision !== WHEEL_DATABASE_REVISION) {
    next = {
      ...rebuildWheelsFromDatabase(next),
      wheelDbRevision: WHEEL_DATABASE_REVISION,
    };
  }
  return normalizeRunState(next as import("../schemas").RunState);
}

export function useRunLifecycle(autoStart = true) {
  const hydrateMeta = useMetaStore((s) => s.hydrate);
  const hydrated = useMetaStore((s) => s.hydrated);
  const startRun = useRunStore((s) => s.startRun);
  const hydrateRun = useRunStore((s) => s.hydrateRun);
  const persist = useRunStore((s) => s.persist);
  const run = useRunStore((s) => s.run);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await initPersistence();
      if (cancelled) return;
      hydrateMeta();
      const checkpoint = loadRunCheckpoint();
      if (checkpoint != null && checkpoint.phase === "active") {
        hydrateRun(migrateRunCheckpoint(checkpoint));
      } else if (autoStart) {
        startRun(1);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [autoStart, hydrateMeta, hydrateRun, startRun]);

  useEffect(() => {
    return () => {
      persist();
    };
  }, [persist]);

  return { ready: hydrated && ready, run };
}
