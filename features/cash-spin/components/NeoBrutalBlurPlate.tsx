import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { Neo } from "../../../theme/neoBrutal";

type Props = {
  accent: string;
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * Frosted neo-brutal plate: native blur + ink rim + hard shadow + accent wash.
 * Web falls back to solid glass (no native blur).
 */
export function NeoBrutalBlurPlate({ accent, children, style, contentStyle }: Props) {
  const blur = Platform.OS !== "web";

  return (
    <View style={[styles.cast, style]}>
      <View style={styles.shell}>
        {blur ? (
          <BlurView
            intensity={Platform.OS === "ios" ? 38 : 52}
            tint="light"
            style={StyleSheet.absoluteFill}
            {...(Platform.OS === "android"
              ? { experimentalBlurMethod: "dimezisBlurView" as const }
              : {})}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webGlass]} />
        )}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: accent, opacity: 0.1 }]} />
        <View style={[styles.foreground, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cast: {
    shadowColor: Neo.accentInk,
    shadowOffset: Neo.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: Platform.OS === "android" ? 12 : 8,
  },
  shell: {
    borderRadius: 11,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  webGlass: {
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  foreground: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
});
