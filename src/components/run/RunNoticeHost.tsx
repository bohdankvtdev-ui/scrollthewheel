import { MaterialIcons } from "@expo/vector-icons";
import { VectorIcon } from "../../../lib/ui/VectorIcon";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { useRunToastStore, type RunToastType } from "../../stores/runToastStore";

const TYPE_STYLE: Record<RunToastType, { bg: string; accent: string; icon: string }> = {
  success: { bg: Neo.neonYellow, accent: "#FDE047", icon: "check-circle" },
  error: { bg: "#FEE2E2", accent: "#FCA5A5", icon: "error-outline" },
  info: { bg: Neo.neonCyan, accent: "#67E8F9", icon: "info-outline" },
};

function ToastIcon({ name, type, size }: { name?: string; type: RunToastType; size: number }) {
  const iconName = name ?? TYPE_STYLE[type].icon;
  return <VectorIcon name={iconName} size={size} color={Neo.ink} />;
}

/** Compact notice directly under the perk loadout (in `loadoutStack`). */
export function RunNoticeHost() {
  const chrome = useRunChromeMetrics();
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
    <View
      style={[styles.anchor, { top: chrome.layout.loadout + 2 }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={dismiss}
        style={[
          styles.card,
          {
            backgroundColor: palette.bg,
            borderColor: palette.accent,
            maxWidth: chrome.notice.maxWidth,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          toast.body != null && toast.body.length > 0
            ? `${toast.title}. ${toast.body}`
            : toast.title
        }
      >
        <View style={[styles.iconDot, { width: chrome.notice.iconSize + 8, height: chrome.notice.iconSize + 8 }]}>
          <ToastIcon name={toast.icon} type={toast.type} size={chrome.notice.iconSize} />
        </View>
        <View style={styles.copy}>
          <Text
            style={[
              styles.title,
              { fontFamily: FONT_BEBAS_NEUE, fontSize: chrome.notice.titleFontSize, lineHeight: chrome.notice.titleFontSize + 2 },
            ]}
          >
            {toast.title}
          </Text>
          {toast.body != null && toast.body.length > 0 ? (
            <Text style={[styles.body, { fontSize: chrome.notice.bodyFontSize, lineHeight: chrome.notice.bodyFontSize + 3 }]}>
              {toast.body}
            </Text>
          ) : null}
        </View>
        <MaterialIcons name="close" size={chrome.notice.iconSize} color="rgba(15,15,20,0.38)" style={styles.close} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 150,
    elevation: 150,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    borderWidth: Neo.borderThin,
    borderRadius: 10,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
    shadowColor: Neo.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 4,
  },
  iconDot: {
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
    color: Neo.ink,
    letterSpacing: 0.25,
    flexShrink: 1,
  },
  body: {
    marginTop: 2,
    color: "rgba(15,15,20,0.85)",
    flexShrink: 1,
  },
  close: {
    marginTop: 1,
    flexShrink: 0,
  },
});
