import { Asset } from "expo-asset";
import { useEffect, useState } from "react";
import { APP_TEXTURE } from "../constants/textureOverlay";
import { useBebasNeueFonts } from "../../theme/fonts";

/**
 * Blocks the root UI until fonts and the full-screen texture are cached.
 * Pair with `SplashScreen.preventAutoHideAsync` in `app/_layout.tsx`.
 */
export function useAppBootstrap(): boolean {
  const [fontsLoaded, fontError] = useBebasNeueFonts();
  const [textureReady, setTextureReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Asset.fromModule(APP_TEXTURE as number)
      .downloadAsync()
      .then(() => {
        if (!cancelled) setTextureReady(true);
      })
      .catch(() => {
        if (!cancelled) setTextureReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fontsReady = fontsLoaded || fontError != null;
  return fontsReady && textureReady;
}
