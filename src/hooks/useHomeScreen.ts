import { useEffect, useState } from "react";
import { initAppServices } from "../services/initApp";
import { useMetaStore } from "../stores/metaStore";

export function useHomeScreen() {
  const hydrated = useMetaStore((s) => s.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await initAppServices();
      if (cancelled) return;
      useMetaStore.getState().hydrate();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready: hydrated && ready };
}
