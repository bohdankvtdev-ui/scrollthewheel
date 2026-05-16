import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { useRunToastStore, type RunToastType } from "../../stores/runToastStore";

const TYPE_STYLE: Record<RunToastType, { bg: string; border: string }> = {
  success: { bg: Neo.neonYellow, border: Neo.ink },
  error: { bg: "#FEE2E2", border: Neo.ink },
  info: { bg: Neo.neonCyan, border: Neo.ink },
};

export function RunToastHost() {
  const toast = useRunToastStore((s) => s.toast);
  const dismiss = useRunToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toast == null) return;
    const id = setTimeout(dismiss, 2800);
    return () => clearTimeout(id);
  }, [dismiss, toast]);

  const style = toast != null ? TYPE_STYLE[toast.type] : null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {toast != null && style != null ? (
    <Animated.View
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(140)}
      style={styles.toastLayer}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={dismiss}
        style={[styles.card, { backgroundColor: style.bg, borderColor: style.border }]}
      >
        <MaterialIcons
          name={(toast.icon as keyof typeof MaterialIcons.glyphMap) ?? "emoji-events"}
          size={28}
          color={Neo.ink}
        />
        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={2}>
          {toast.title}
        </Text>
      </Pressable>
    </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    pointerEvents: "box-none",
  },
  toastLayer: {
    position: "absolute",
    top: 4,
    left: 16,
    right: 16,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: Neo.borderBold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 360,
    width: "100%",
    shadowColor: Neo.ink,
    shadowOffset: Neo.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
});
