import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GuideScreenHeader } from "../components/guide/GuideScreenHeader";
import {
  formatProgressionRow,
  getProgressionTableRows,
  PROGRESSION_GUIDE_SECTIONS,
} from "../game/guide/progressionGuideContent";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoCardStyle } from "../../theme/neoBrutal";

export function ProgressionGuideScreen() {
  const router = useRouter();
  const table = useMemo(() => getProgressionTableRows(0), []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <GuideScreenHeader title="Progression & math" onBack={() => router.back()} />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {PROGRESSION_GUIDE_SECTIONS.map((section) => (
          <View key={section.id} style={[styles.section, neoCardStyle()]}>
            <Text style={[styles.heading, { fontFamily: FONT_BEBAS_NEUE }]}>
              {section.heading}
            </Text>
            <Text style={styles.bodyText}>{section.body}</Text>
            {section.bullets?.map((line) => (
              <Text key={line} style={styles.bullet}>
                · {line}
              </Text>
            ))}
          </View>
        ))}

        <Text style={[styles.tableTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
          Cycle scaling table
        </Text>
        <Text style={styles.tableHint}>
          Reference values at 0 perks — shop and relics shift weights in-run.
        </Text>

        {table.map((row) => (
          <View key={row.cycle} style={[styles.rowCard, neoCardStyle()]}>
            <View style={styles.rowHead}>
              <Text style={[styles.rowCycle, { fontFamily: FONT_BEBAS_NEUE }]}>
                Cycle {row.cycle}
              </Text>
              <Text style={[styles.rowTier, { fontFamily: FONT_BEBAS_NEUE }]}>
                {row.advancementLabel}
              </Text>
            </View>
            <Text style={styles.rowDetail}>{formatProgressionRow(row)}</Text>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
          onPress={() => router.push("/wheel-odds")}
        >
          <Text style={[styles.linkText, { fontFamily: FONT_BEBAS_NEUE }]}>
            Explore all wheel land % →
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.aboutBtn, pressed && styles.linkPressed]}
          onPress={() => router.push("/about")}
        >
          <Text style={[styles.aboutText, { fontFamily: FONT_BEBAS_NEUE }]}>About & legal</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Neo.pageBg },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 36, gap: 12 },
  section: {
    padding: 14,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heading: {
    fontSize: 18,
    color: Neo.neonYellow,
    letterSpacing: 0.4,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#E2E8F0",
  },
  bullet: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(250,250,250,0.75)",
    paddingLeft: 4,
  },
  tableTitle: {
    marginTop: 8,
    fontSize: 16,
    color: Neo.textOnDark,
    letterSpacing: 0.5,
  },
  tableHint: {
    fontSize: 12,
    color: "rgba(250,250,250,0.45)",
    marginBottom: 4,
  },
  rowCard: {
    padding: 12,
    gap: 6,
    backgroundColor: Neo.neonCyan,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowCycle: { fontSize: 18, color: Neo.ink },
  rowTier: { fontSize: 11, color: "rgba(10,10,10,0.55)", letterSpacing: 0.3 },
  rowDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: Neo.ink,
  },
  linkBtn: { alignSelf: "center", paddingVertical: 14 },
  linkText: { fontSize: 15, color: Neo.neonCyan, letterSpacing: 0.3 },
  linkPressed: { opacity: 0.85 },
  aboutBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
    borderRadius: 10,
  },
  aboutText: { fontSize: 14, color: "rgba(250,250,250,0.6)" },
});
