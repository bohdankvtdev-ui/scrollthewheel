import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { HomeWheelDeco } from "../components/home/HomeWheelDeco";
import { APP_DISPLAY_NAME } from "../constants/appBranding";
import { useMetaStore } from "../stores/metaStore";
import { formatMoney } from "../utils/formatMoney";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoSubtitleOnDark, neoTitleOnDark } from "../../theme/neoBrutal";

const TAGS = ["9 wheels", "Chip shop", "One life"] as const;

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontFamily: FONT_BEBAS_NEUE }]}>{label}</Text>
    </View>
  );
}

function FeatureChip({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.featureChip, { backgroundColor: color }]}>
      <Text style={[styles.featureChipText, { fontFamily: FONT_BEBAS_NEUE }]}>{text}</Text>
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const bestFloor = useMetaStore((s) => s.bestFloor);
  const bestPeakMoney = useMetaStore((s) => s.bestPeakMoney ?? 0);
  const totalChips = useMetaStore((s) => s.totalChips ?? 0);
  const totalRuns = useMetaStore((s) => s.totalRuns ?? 0);
  const hasRecords = bestFloor > 0 || bestPeakMoney > 0 || totalChips > 0;

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  const goRun = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/run");
  };

  const goDesign = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/design");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.decoBlobA} />
          <View style={styles.decoBlobB} />
          <HomeWheelDeco />
          <Text style={[styles.kicker, { fontFamily: FONT_BEBAS_NEUE }]}>Roguelike wheel run</Text>
          <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} accessibilityRole="header">
            {APP_DISPLAY_NAME.toUpperCase()}
          </Text>
          <Text style={neoSubtitleOnDark(15)}>
            Spin the strip. Bank the cash. Don&apos;t hit zero.
          </Text>
          <View style={styles.tagRow}>
            {TAGS.map((tag, i) => (
              <FeatureChip
                key={tag}
                text={tag}
                color={
                  i === 0 ? Neo.neonYellow : i === 1 ? Neo.neonCyan : Neo.neonMagenta
                }
              />
            ))}
          </View>
        </View>

        {hasRecords ? (
          <View style={styles.statsCard}>
            <Text style={[styles.statsTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
              Your legend
            </Text>
            <View style={styles.statsRow}>
              {bestPeakMoney > 0 ? (
                <StatPill label="Best bank" value={formatMoney(bestPeakMoney)} />
              ) : null}
              {bestFloor > 0 ? (
                <StatPill label="Best cycle" value={`${bestFloor}`} />
              ) : null}
              {totalChips > 0 ? (
                <StatPill label="Meta chips" value={`${totalChips}`} />
              ) : null}
              {totalRuns > 0 ? (
                <StatPill label="Runs" value={`${totalRuns}`} />
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.firstRunCard}>
            <MaterialCommunityIcons name="cards-playing-outline" size={28} color={Neo.ink} />
            <Text style={[styles.firstRunTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
              First run?
            </Text>
            <Text style={styles.firstRunBody}>
              Clear nine wheels per cycle. Spend chips in the shop. Trick-or-treat tactics
              appear on special wheels.
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.heroBtn, pressed && styles.heroBtnPressed]}
          onPress={goRun}
          accessibilityRole="button"
          accessibilityLabel="Start roguelike run"
        >
          <View style={styles.heroBtnInner}>
            <View style={styles.heroBtnIcon}>
              <MaterialCommunityIcons name="play-circle" size={36} color={Neo.ink} />
            </View>
            <View style={styles.heroBtnCopy}>
              <Text style={[styles.heroBtnTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
                Start run
              </Text>
              <Text style={[styles.heroBtnSub, { fontFamily: FONT_BEBAS_NEUE }]}>
                New cycle · spin · swipe · survive
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={28} color={Neo.ink} />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
          onPress={goDesign}
          accessibilityRole="button"
          accessibilityLabel="Open game data reference"
        >
          <MaterialIcons name="data-object" size={22} color={Neo.ink} />
          <Text style={[styles.secondaryBtnText, { fontFamily: FONT_BEBAS_NEUE }]}>
            Game data & odds
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Pressable
            onPress={() => router.push("/credits")}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Credits"
          >
            <Text style={[styles.footerLink, { fontFamily: FONT_BEBAS_NEUE }]}>Credits</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable
            onPress={() => router.push("/privacy")}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Privacy policy"
          >
            <Text style={[styles.footerLink, { fontFamily: FONT_BEBAS_NEUE }]}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>
        <Text style={styles.version}>v{version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Neo.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 28,
    alignItems: "center",
  },
  hero: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
    position: "relative",
  },
  decoBlobA: {
    position: "absolute",
    top: 40,
    left: -24,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Neo.neonMagenta,
    opacity: 0.35,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  decoBlobB: {
    position: "absolute",
    top: 120,
    right: -20,
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Neo.neonCyan,
    opacity: 0.4,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    transform: [{ rotate: "12deg" }],
  },
  kicker: {
    fontSize: 14,
    color: Neo.neonYellow,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  title: {
    ...neoTitleOnDark(42),
    lineHeight: 44,
    marginTop: 4,
    maxWidth: 340,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  featureChipText: {
    fontSize: 13,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
  statsCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  statsTitle: {
    fontSize: 16,
    color: Neo.textOnDark,
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  statPill: {
    minWidth: 88,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 11,
    color: Neo.inkMuted,
    letterSpacing: 0.35,
    marginTop: 2,
  },
  firstRunCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Neo.neonCyan,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    alignItems: "center",
    gap: 6,
  },
  firstRunTitle: {
    fontSize: 20,
    color: Neo.ink,
    letterSpacing: 0.4,
  },
  firstRunBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Neo.inkMuted,
    textAlign: "center",
  },
  heroBtn: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Neo.ink,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  heroBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    shadowOffset: { width: 2, height: 2 },
  },
  heroBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  heroBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBtnCopy: {
    flex: 1,
    gap: 2,
  },
  heroBtnTitle: {
    fontSize: 26,
    color: Neo.ink,
    letterSpacing: 0.5,
  },
  heroBtnSub: {
    fontSize: 12,
    color: Neo.inkMuted,
    letterSpacing: 0.35,
  },
  secondaryBtn: {
    width: "100%",
    maxWidth: 380,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 12,
    marginBottom: 24,
  },
  secondaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  secondaryBtnText: {
    fontSize: 16,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  footerLink: {
    fontSize: 15,
    color: Neo.textOnDark,
    letterSpacing: 0.4,
    textDecorationLine: "underline",
  },
  footerDot: {
    fontSize: 15,
    color: Neo.textMutedOnDark,
  },
  version: {
    marginTop: 10,
    fontSize: 11,
    color: "rgba(250,250,250,0.45)",
    letterSpacing: 0.3,
  },
});
