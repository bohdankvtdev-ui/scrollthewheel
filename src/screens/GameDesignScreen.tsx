import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { GameContent, SLICE_POOLS } from "../game";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoCardStyle } from "../../theme/neoBrutal";

type Tab = "gdd" | "loop" | "wheels" | "pools" | "shop" | "scaling";

const TABS: { id: Tab; label: string }[] = [
  { id: "gdd", label: "GDD" },
  { id: "loop", label: "Loop" },
  { id: "wheels", label: "Wheels" },
  { id: "pools", label: "Prizes" },
  { id: "shop", label: "Shop" },
  { id: "scaling", label: "Infinite" },
];

export function GameDesignScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("loop");
  const snap = useMemo(() => GameContent.snapshot(), []);
  const validation = useMemo(() => GameContent.validate(), []);

  const body = useMemo(() => {
    switch (tab) {
      case "gdd":
        return snap.gdd;
      case "loop":
        return { loop: snap.loop, runDefaults: snap.runDefaults };
      case "wheels":
        return snap.wheelRotation.map((w) => ({
          id: w.id,
          role: w.role,
          title: w.title,
          pool: w.slicePoolId,
          slices: w.sliceCount,
          physics: w.physicsProfileId,
          modifiers: w.modifiers,
        }));
      case "pools":
        return Object.fromEntries(
          snap.slicePoolIds.map((id) => {
            const pool = SLICE_POOLS[id as keyof typeof SLICE_POOLS];
            return [
              id,
              pool?.map((s) => ({
                id: s.id,
                kind: s.kind,
                label: s.label,
                weight: s.baseWeight,
                tags: s.weightTags,
                payload: s.payload,
              })),
            ];
          })
        );
      case "shop":
        return { shopTree: snap.shopTree, perks: snap.perks };
      case "scaling":
        return {
          config: snap.infiniteScaling,
          progressionTable: snap.progressionTable,
          scalingPreview: snap.scalingPreview,
        };
      default:
        return {};
    }
  }, [snap, tab]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={Neo.textOnDark} />
        </Pressable>
        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>Game content</Text>
        <Pressable
          onPress={() => router.push("/about")}
          hitSlop={8}
          style={styles.aboutBtn}
          accessibilityRole="button"
          accessibilityLabel="About and legal"
        >
          <MaterialIcons name="info-outline" size={22} color={Neo.textOnDark} />
        </Pressable>
        <View
          style={[
            styles.badge,
            { backgroundColor: validation.ok ? Neo.neonCyan : "#FEE2E2" },
          ]}
        >
          <Text style={styles.badgeText}>{validation.ok ? "OK" : `${validation.errors.length} err`}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, { fontFamily: FONT_BEBAS_NEUE }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {!validation.ok ? (
          <View style={[neoCardStyle(), styles.errCard]}>
            <Text style={styles.errTitle}>Validation</Text>
            {validation.errors.map((e) => (
              <Text key={e} style={styles.errLine}>
                • {e}
              </Text>
            ))}
          </View>
        ) : null}
        <Text style={styles.json} selectable>
          {JSON.stringify(body, null, 2)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Neo.pageBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    backgroundColor: Neo.headerBg,
  },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 22, color: Neo.textOnDark, letterSpacing: 0.5 },
  aboutBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: Neo.ink, fontWeight: "700" },
  tabs: { paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
  },
  tabActive: { backgroundColor: Neo.neonYellow, borderColor: Neo.ink },
  tabText: { fontSize: 14, color: Neo.textOnDark },
  body: { flex: 1 },
  bodyContent: { padding: 12, paddingBottom: 32 },
  json: {
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
    color: "#E2E8F0",
  },
  errCard: { marginBottom: 12, backgroundColor: "#FEE2E2" },
  errTitle: { fontWeight: "800", color: Neo.ink, marginBottom: 6 },
  errLine: { color: Neo.ink, fontSize: 12, marginBottom: 2 },
});
