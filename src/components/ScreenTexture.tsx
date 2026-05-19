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
 * Matte paper overlay behind app content (must not sit above interactive UI / toasts).
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
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: TEXTURE_OVERLAY_OPACITY,
    zIndex: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
