import { useEffect, useState } from "react";
import { loadRunCheckpoint } from "../persistence/mmkv";
import { initAppServices } from "../services/initApp";
import { useMetaStore } from "../stores/metaStore";
import { migrateRunCheckpoint } from "../game/runState/migrateCheckpoint";
import { useRunStore } from "../stores/runStore";

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
      await initAppServices();
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
