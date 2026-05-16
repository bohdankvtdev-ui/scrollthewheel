import type { ReactNode } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { useRunToastStore } from "../../stores/runToastStore";
import { CompactStatPill } from "./CompactStatPill";

type RunHeaderProps = {
  run: RunState;
  onReset: () => void;
};

function HeaderActionBtn({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: tint },
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function RunHeader({ run, onReset }: RunHeaderProps) {
  const router = useRouter();
  const showToast = useRunToastStore((s) => s.show);

  return (
    <View style={styles.wrap}>
      <View style={styles.statsRow}>
        <CompactStatPill
          icon={<MaterialIcons name="attach-money" size={20} color={Neo.ink} />}
          value={`$${run.money}`}
          tint={Neo.neonYellow}
          accessibilityLabel={`Money ${run.money}`}
          onPress={() =>
            showToast({ type: "info", title: `Bank: $${run.money}`, icon: "attach-money" })
          }
        />
        <CompactStatPill
          icon={<MaterialIcons name="stars" size={20} color={Neo.ink} />}
          value={run.perks.length}
          tint="#EDE9FE"
          accessibilityLabel={`${run.perks.length} perks`}
          onPress={() =>
            showToast({
              type: "info",
              title: `${run.perks.length} perk${run.perks.length === 1 ? "" : "s"} owned`,
              icon: "stars",
            })
          }
        />
        <CompactStatPill
          icon={<MaterialCommunityIcons name="stairs" size={18} color={Neo.ink} />}
          value={`F${run.floor}`}
          tint={Neo.neonCyan}
          accessibilityLabel={`Floor ${run.floor}`}
          onPress={() =>
            showToast({ type: "info", title: `Floor ${run.floor}`, icon: "stairs" })
          }
        />
      </View>
      <View style={styles.actions}>
        <HeaderActionBtn
          label="Reset run"
          tint="#FEE2E2"
          onPress={onReset}
          icon={<MaterialIcons name="refresh" size={24} color={Neo.ink} />}
        />
        <HeaderActionBtn
          label="Back to menu"
          tint="rgba(255,255,255,0.14)"
          onPress={() => router.push("/")}
          icon={<MaterialIcons name="home" size={24} color={Neo.textOnDark} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.header,
    backgroundColor: Neo.headerBg,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
});
