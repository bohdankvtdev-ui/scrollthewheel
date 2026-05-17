import type { ReactNode } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { APP_TEXTURE, TEXTURE_OVERLAY_OPACITY } from "../constants/textureOverlay";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Static matte paper overlay — no animation, no pointer capture. */
export function ScreenTexture({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {children}
      <Image
        source={APP_TEXTURE}
        style={styles.texture}
        resizeMode="repeat"
        fadeDuration={0}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
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
