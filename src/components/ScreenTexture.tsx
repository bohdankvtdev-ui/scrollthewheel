import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { APP_TEXTURE, TEXTURE_OVERLAY_OPACITY } from "../constants/textureOverlay";
import { useMetaStore } from "../stores/metaStore";
import { isCompactWindow } from "../utils/deviceTier";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Matte paper overlay — skipped on compact windows to save ~1MB+ decoded bitmap RAM.
 * Uses expo-image disk cache when enabled.
 */
export function ScreenTexture({ children, style }: Props) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useMetaStore((s) => s.settings.reducedMotion);
  const showTexture =
    !reducedMotion &&
    width > 0 &&
    height > 0 &&
    !isCompactWindow(width, height);

  return (
    <View style={[styles.container, style]}>
      {children}
      {showTexture ? (
        <Image
          source={APP_TEXTURE}
          style={styles.texture}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey="app-screen-texture"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: TEXTURE_OVERLAY_OPACITY,
    zIndex: 9999,
  },
});
