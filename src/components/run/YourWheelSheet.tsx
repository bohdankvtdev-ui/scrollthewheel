import { useMemo } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { buildRunWheelOddsReport } from "../../game/wheels/wheelOddsReport";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import type { RunState } from "../../schemas";

const UI = {
  bg: "#0F0A18",
  card: "#1A1228",
  border: "#2D2440",
  text: "#FAFAFA",
  muted: "rgba(250,250,250,0.62)",
  accent: "#22D3EE",
  current: "#FFE94D",
} as const;

type YourWheelSheetProps = {
  visible: boolean;
  run: RunState;
  onClose: () => void;
};

export function YourWheelSheet({ visible, run, onClose }: YourWheelSheetProps) {
  const { height } = useWindowDimensions();
  const report = useMemo(() => buildRunWheelOddsReport(run), [run]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { maxHeight: height * 0.88 }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="album" size={26} color={UI.accent} />
              <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>Your Wheel</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close Your Wheel">
              <MaterialIcons name="close" size={26} color={UI.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { fontFamily: FONT_BEBAS_NEUE }]}>
                {report.globalCapacity} wedges · +{report.capacityBonus} bonus
              </Text>
              <Text style={styles.summaryHint}>
                Land % on current wheel uses your perks, forge & upgrades below.
              </Text>
            </View>

            {report.upgrades.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Upgrades</Text>
                {report.upgrades.map((u) => (
                  <View key={u.id} style={styles.upgradeRow}>
                    <Text style={styles.upgradeLabel}>{u.label}</Text>
                    <Text style={styles.upgradeDetail}>{u.detail}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
                Spin modifiers (current wheel)
              </Text>
              <View style={styles.modRow}>
                {report.spinModifiers.map((m) => (
                  <View key={m.label} style={styles.modChip}>
                    <Text style={styles.modLabel}>{m.label}</Text>
                    <Text style={[styles.modValue, { fontFamily: FONT_BEBAS_NEUE }]}>{m.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {report.wheels.map((w) => {
              const meta = getWheelArchetypeMetaForIndex(w.wheelIndex);
              return (
                <View
                  key={w.configId}
                  style={[styles.wheelCard, w.isCurrent && styles.wheelCardCurrent]}
                >
                  <View style={styles.wheelCardHeader}>
                    <MaterialIcons
                      name={meta.icon as keyof typeof MaterialIcons.glyphMap}
                      size={20}
                      color={meta.accent}
                    />
                    <Text style={[styles.wheelTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
                      {meta.mapLabel} · {w.title}
                    </Text>
                    <Text style={styles.wheelCount}>{w.sliceCount}</Text>
                    {w.isCurrent ? (
                      <Text style={[styles.badgeCurrent, { fontFamily: FONT_BEBAS_NEUE }]}>NOW</Text>
                    ) : null}
                  </View>
                  {w.slices.length === 0 ? (
                    <Text style={styles.emptyWheel}>Not built yet</Text>
                  ) : (
                    w.slices.map((s, i) => (
                      <View key={`${w.configId}-${i}`} style={styles.sliceRow}>
                        <Text style={styles.sliceLabel} numberOfLines={1}>
                          {s.label}
                        </Text>
                        <Text style={[styles.slicePct, { fontFamily: FONT_BEBAS_NEUE }]}>
                          {s.landPct.toFixed(1)}%
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: UI.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: Neo.borderThin,
    borderBottomColor: UI.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 26,
    color: UI.text,
    letterSpacing: 0.5,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  summaryRow: {
    gap: 4,
  },
  summaryText: {
    fontSize: 20,
    color: UI.accent,
    letterSpacing: 0.3,
  },
  summaryHint: {
    fontSize: 13,
    color: UI.muted,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: UI.text,
    letterSpacing: 0.4,
  },
  upgradeRow: {
    backgroundColor: UI.card,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: UI.border,
    padding: 10,
    gap: 2,
  },
  upgradeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: UI.text,
  },
  upgradeDetail: {
    fontSize: 12,
    color: UI.muted,
  },
  modRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modChip: {
    backgroundColor: UI.card,
    borderRadius: 8,
    borderWidth: Neo.borderThin,
    borderColor: UI.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  modLabel: {
    fontSize: 11,
    color: UI.muted,
  },
  modValue: {
    fontSize: 15,
    color: UI.text,
  },
  wheelCard: {
    backgroundColor: UI.card,
    borderRadius: 12,
    borderWidth: Neo.borderThin,
    borderColor: UI.border,
    padding: 12,
    gap: 6,
  },
  wheelCardCurrent: {
    borderColor: UI.current,
    borderWidth: Neo.borderBold,
  },
  wheelCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  wheelTitle: {
    flex: 1,
    fontSize: 17,
    color: UI.text,
  },
  wheelCount: {
    fontSize: 13,
    color: UI.muted,
  },
  badgeCurrent: {
    fontSize: 12,
    color: UI.current,
    letterSpacing: 0.5,
  },
  emptyWheel: {
    fontSize: 13,
    color: UI.muted,
    fontStyle: "italic",
  },
  sliceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  sliceLabel: {
    flex: 1,
    fontSize: 14,
    color: UI.text,
  },
  slicePct: {
    fontSize: 15,
    color: UI.accent,
    minWidth: 52,
    textAlign: "right",
  },
});
