import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { useRunToastStore, type RunToastType } from "../../stores/runToastStore";

const TYPE_STYLE: Record<RunToastType, { bg: string; accent: string; icon: string }> = {
  success: { bg: Neo.neonYellow, accent: "#FDE047", icon: "check-circle" },
  error: { bg: "#FEE2E2", accent: "#FCA5A5", icon: "error-outline" },
  info: { bg: Neo.neonCyan, accent: "#67E8F9", icon: "info-outline" },
};

const MCI_ICONS = new Set([
  "undo-variant",
  "shield-check",
  "dice-multiple",
  "poker-chip",
  "ray-start",
  "shield",
  "album",
  "build",
  "sell",
  "stars",
  "stairs",
  "attach-money",
]);

function ToastIcon({ name, type }: { name?: string; type: RunToastType }) {
  const iconName = name ?? TYPE_STYLE[type].icon;
  if (MCI_ICONS.has(iconName)) {
    return (
      <MaterialCommunityIcons
        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
        size={14}
        color={Neo.ink}
      />
    );
  }
  return (
    <MaterialIcons
      name={(iconName as keyof typeof MaterialIcons.glyphMap) ?? "info-outline"}
      size={14}
      color={Neo.ink}
    />
  );
}

/** Compact notice directly under the perk loadout (in `loadoutStack`). */
export function RunNoticeHost() {
  const toast = useRunToastStore((s) => s.toast);
  const dismiss = useRunToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toast == null) return;
    const id = setTimeout(dismiss, toast.durationMs);
    return () => clearTimeout(id);
  }, [dismiss, toast?.id, toast?.durationMs]);

  if (toast == null) return null;

  const palette = TYPE_STYLE[toast.type];

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <Pressable
        onPress={dismiss}
        style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.accent }]}
        accessibilityRole="button"
        accessibilityLabel={
          toast.body != null && toast.body.length > 0
            ? `${toast.title}. ${toast.body}`
            : toast.title
        }
      >
        <View style={styles.iconDot}>
          <ToastIcon name={toast.icon} type={toast.type} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>{toast.title}</Text>
          {toast.body != null && toast.body.length > 0 ? (
            <Text style={styles.body}>{toast.body}</Text>
          ) : null}
        </View>
        <MaterialIcons name="close" size={14} color="rgba(15,15,20,0.38)" style={styles.close} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: 12,
    right: 12,
    top: RUN_LAYOUT.loadout + 2,
    zIndex: 50,
    elevation: 50,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 340,
    borderWidth: Neo.borderThin,
    borderRadius: 10,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },
  iconDot: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: 8,
    marginRight: 4,
  },
  title: {
    fontSize: 14,
    color: Neo.ink,
    letterSpacing: 0.25,
    lineHeight: 16,
    flexShrink: 1,
  },
  body: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
    color: "rgba(15,15,20,0.85)",
    flexShrink: 1,
  },
  close: {
    marginTop: 1,
    flexShrink: 0,
  },
});
