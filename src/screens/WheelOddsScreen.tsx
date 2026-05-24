import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GuideScreenHeader } from "../components/guide/GuideScreenHeader";
import { getWheelArchetypeMetaForIndex } from "../data/wheelArchetypeMeta";
import {
  buildWheelOddsSnapshot,
  PREVIEW_CYCLES,
  type PreviewCycle,
} from "../game/guide/wheelOddsData";
import { FLOOR_WHEEL_ORDER } from "../game/wheels/database/wheelDatabase";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoCardStyle } from "../../theme/neoBrutal";

export function WheelOddsScreen() {
  const router = useRouter();
  const [cycle, setCycle] = useState<PreviewCycle>(1);
  const [wheelIndex, setWheelIndex] = useState(0);

  const configId = FLOOR_WHEEL_ORDER[wheelIndex] ?? "wheel_1";
  const meta = getWheelArchetypeMetaForIndex(wheelIndex);
  const snapshot = useMemo(
    () => buildWheelOddsSnapshot(configId, cycle),
    [configId, cycle]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <GuideScreenHeader title="Wheel odds" onBack={() => router.back()} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cycleRow}
      >
        {PREVIEW_CYCLES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCycle(c)}
            style={[styles.cycleChip, cycle === c && styles.cycleChipActive]}
          >
            <Text style={[styles.cycleChipText, { fontFamily: FONT_BEBAS_NEUE }]}>
              Cycle {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.wheelRow}
      >
        {FLOOR_WHEEL_ORDER.map((id, i) => {
          const m = getWheelArchetypeMetaForIndex(i);
          const active = i === wheelIndex;
          return (
            <Pressable
              key={id}
              onPress={() => setWheelIndex(i)}
              style={[
                styles.wheelChip,
                active && { backgroundColor: m.accent, borderColor: Neo.ink },
              ]}
            >
              <Text
                style={[
                  styles.wheelChipText,
                  { fontFamily: FONT_BEBAS_NEUE },
                  active && styles.wheelChipTextActive,
                ]}
              >
                {m.mapLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={[styles.heroCard, neoCardStyle()]}>
          <View style={[styles.heroIcon, { backgroundColor: `${meta.accent}55` }]}>
            <MaterialCommunityIcons
              name={meta.icon as "circle-slice-8"}
              size={26}
              color={Neo.ink}
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
              {meta.tag} · {snapshot.title}
            </Text>
            <Text style={[styles.heroSub, { fontFamily: FONT_BEBAS_NEUE }]}>
              {snapshot.sliceCount} wedges · land % sum {snapshot.landSum}% · cycle {cycle}{" "}
              layout
            </Text>
          </View>
        </View>

        <Text style={[styles.hint, { fontFamily: FONT_BEBAS_NEUE }]}>
          Land % = wedge size on wheel. Spin % = one-spin win chance (base perks off).
        </Text>

        <View style={[styles.table, neoCardStyle()]}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thLabel, { fontFamily: FONT_BEBAS_NEUE }]}>
              Prize
            </Text>
            <Text style={[styles.th, { fontFamily: FONT_BEBAS_NEUE }]}>Land</Text>
            <Text style={[styles.th, { fontFamily: FONT_BEBAS_NEUE }]}>Spin</Text>
          </View>
          {snapshot.rows.map((row) => (
            <View key={`${row.label}-${row.landPct}`} style={styles.tableRow}>
              <View style={styles.tdLabel}>
                <Text style={[styles.prizeLabel, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={2}>
                  {row.label}
                </Text>
                <Text style={styles.prizeMeta}>{row.kind}</Text>
              </View>
              <Text style={[styles.tdNum, { fontFamily: FONT_BEBAS_NEUE }]}>{row.landPct}%</Text>
              <Text style={[styles.tdNum, styles.tdSpin, { fontFamily: FONT_BEBAS_NEUE }]}>
                {row.spinPct}%
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
          onPress={() => router.push("/progression")}
        >
          <Text style={[styles.linkText, { fontFamily: FONT_BEBAS_NEUE }]}>
            How cycles scale money & losses →
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Neo.pageBg },
  cycleRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  cycleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
  },
  cycleChipActive: {
    backgroundColor: Neo.neonCyan,
    borderColor: Neo.ink,
  },
  cycleChipText: { fontSize: 14, color: Neo.textOnDark },
  wheelRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  wheelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.3)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  wheelChipText: { fontSize: 13, color: "rgba(250,250,250,0.7)" },
  wheelChipTextActive: { color: Neo.ink },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 32, gap: 12 },
  heroCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: Neo.neonYellow,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 20, color: Neo.ink },
  heroSub: { fontSize: 12, color: "rgba(10,10,10,0.55)", letterSpacing: 0.2 },
  hint: {
    fontSize: 12,
    color: "rgba(250,250,250,0.5)",
    letterSpacing: 0.3,
    lineHeight: 17,
  },
  table: { padding: 0, overflow: "hidden", backgroundColor: "#F4EFE6" },
  tableHead: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Neo.ink,
    gap: 8,
  },
  th: { flex: 1, fontSize: 11, color: Neo.neonYellow, letterSpacing: 0.6 },
  thLabel: { flex: 2 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10,10,10,0.08)",
    gap: 8,
  },
  tdLabel: { flex: 2, gap: 2 },
  prizeLabel: { fontSize: 15, color: Neo.ink },
  prizeMeta: { fontSize: 10, color: "rgba(10,10,10,0.45)", textTransform: "uppercase" },
  tdNum: { flex: 1, fontSize: 15, color: Neo.ink, textAlign: "right" },
  tdSpin: { color: "#0d9488", fontWeight: "600" },
  linkBtn: {
    alignSelf: "center",
    paddingVertical: 12,
  },
  linkText: { fontSize: 14, color: Neo.neonCyan, letterSpacing: 0.3 },
  linkPressed: { opacity: 0.8 },
});
