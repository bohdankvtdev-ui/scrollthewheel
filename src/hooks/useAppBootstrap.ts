import { Asset } from "expo-asset";
import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { APP_TEXTURE } from "../constants/textureOverlay";
import { useBebasNeueFonts } from "../../theme/fonts";
import { isCompactWindow } from "../utils/deviceTier";
import { initAppServices } from "../services/initApp";

/**
 * Blocks the root UI until fonts (and texture on full-size windows) are ready.
 * Pair with `SplashScreen.preventAutoHideAsync` in `app/_layout.tsx`.
 */
export function useAppBootstrap(): boolean {
  const { width, height } = useWindowDimensions();
  const skipTexture =
    width > 0 && height > 0 && isCompactWindow(width, height);
  const [fontsLoaded, fontError] = useBebasNeueFonts();
  const [textureReady, setTextureReady] = useState(false);
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void initAppServices().then(() => {
      if (!cancelled) setServicesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    if (skipTexture) {
      setTextureReady(true);
      return;
    }
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
  }, [skipTexture, width, height]);

  const fontsReady = fontsLoaded || fontError != null;
  return fontsReady && textureReady && servicesReady;
}
