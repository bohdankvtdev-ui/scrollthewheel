import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeBackdrop } from "../components/home/HomeBackdrop";
import { HomeEdgeButton, HomeMiniStat } from "../components/home/HomeEdgeButton";
import { HomeHeroStage } from "../components/home/HomeHeroWheels";
import { HomePlayButton } from "../components/home/HomePlayButton";
import { useHomeScreen } from "../hooks/useHomeScreen";
import { useMetaStore } from "../stores/metaStore";
import { useRunStore } from "../stores/runStore";
import { formatMoney } from "../utils/formatMoney";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { useRunChromeMetrics } from "../../lib/layout/runChrome";
import { homeBrutalCard, homeKickerStyle, HomePalette, HomeScreenTheme as T } from "../../theme/homeScreen";

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chrome = useRunChromeMetrics();
  const uiScale = chrome.largeUi ? chrome.scale : 1;
  const { ready } = useHomeScreen();
  const bestFloor = useMetaStore((s) => s.bestFloor);
  const bestPeakMoney = useMetaStore((s) => s.bestPeakMoney ?? 0);
  const totalRuns = useMetaStore((s) => s.totalRuns ?? 0);

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const isNewPlayer = totalRuns === 0;

  const startNewRun = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    useRunStore.getState().startRun(1);
    router.push("/run");
  }, [router]);

  const go = useCallback(
    (path: "/leaderboard" | "/wheel-odds" | "/progression" | "/about") => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(path);
    },
    [router]
  );

  if (!ready) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={HomePalette.purple} />
        </View>
      </SafeAreaView>
    );
  }

  const bankLabel = bestPeakMoney > 0 ? formatMoney(bestPeakMoney) : "—";
  const cycleLabel = bestFloor > 0 ? String(bestFloor) : "—";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <HomeBackdrop />
      <HomeHeroStage />

      <View style={[styles.hud, { paddingTop: insets.top > 0 ? 4 : 8, paddingHorizontal: Math.round(14 * uiScale) }]}>
        <Text
          style={[
            styles.cornerHint,
            homeKickerStyle(),
            { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(11 * uiScale) },
          ]}
        >
          Menu
        </Text>

        <View style={styles.topBar}>
          <HomeEdgeButton
            icon="trophy"
            label="Scores"
            hint="See leaderboard"
            accent={HomePalette.yellow}
            uiScale={uiScale}
            onPress={() => go("/leaderboard")}
          />
          <View style={styles.titleWrap}>
            <View style={[homeBrutalCard(HomePalette.yellow, styles.titleCard), { paddingVertical: Math.round(8 * uiScale), paddingHorizontal: Math.round(14 * uiScale) }]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontFamily: FONT_BEBAS_NEUE,
                    fontSize: Math.round(26 * uiScale),
                    lineHeight: Math.round(28 * uiScale),
                  },
                ]}
                accessibilityRole="header"
              >
                Scroll <Text style={styles.titleThe}>The</Text> Wheel
              </Text>
            </View>
            <Text
              style={[
                styles.tagline,
                { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(12 * uiScale) },
              ]}
            >
              Spin · grow your bank · don&apos;t hit $0
            </Text>
          </View>
          <HomeEdgeButton
            icon="chart-donut-variant"
            label="Chances"
            hint="What wheels can land"
            accent={HomePalette.purpleBright}
            uiScale={uiScale}
            onPress={() => go("/wheel-odds")}
          />
        </View>

        <View style={[styles.midRow, styles.hudCenter]}>
          <HomeEdgeButton
            icon="book-open-page-variant"
            label="How to play"
            hint="Rules and tips"
            accent={HomePalette.orange}
            uiScale={uiScale}
            onPress={() => go("/about")}
          />
          <View style={styles.centerGap} pointerEvents="none">
            <Text style={[styles.wheelsHint, { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(10 * uiScale) }]}>
              Preview
            </Text>
          </View>
          <HomeEdgeButton
            icon="chart-line-variant"
            label="Progress"
            hint="How runs scale up"
            accent={HomePalette.greenBright}
            uiScale={uiScale}
            onPress={() => go("/progression")}
          />
        </View>

        <View style={styles.playZone}>
          <Text
            style={[
              styles.playKicker,
              homeKickerStyle(),
              { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(11 * uiScale) },
            ]}
          >
            Tap to play
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={Math.round(22 * uiScale)}
            color={HomePalette.yellow}
            style={styles.playArrow}
          />
          <HomePlayButton onPress={startNewRun} uiScale={uiScale} />
          <Text
            style={[
              styles.playGoal,
              { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(12 * uiScale), lineHeight: Math.round(16 * uiScale) },
            ]}
          >
            {isNewPlayer
              ? "Your first run starts here — spin wheels and build money."
              : "Beat your best bank score in the next run."}
          </Text>
        </View>

        <Text
          style={[
            styles.statsHead,
            homeKickerStyle(),
            { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(11 * uiScale) },
          ]}
        >
          Your best
        </Text>
        <View style={styles.bottomBar}>
          <HomeMiniStat label="Best score" value={bankLabel} uiScale={uiScale} />
          <HomeMiniStat label="Best round" value={cycleLabel} uiScale={uiScale} />
          <HomeMiniStat label="Games" value={String(totalRuns)} uiScale={uiScale} />
        </View>
        <Text style={[styles.version, { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(10 * uiScale) }]}>
          v{version}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.background,
  },
  hud: {
    flex: 1,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  hudCenter: {
    pointerEvents: "box-none",
  },
  cornerHint: {
    alignSelf: "center",
    marginBottom: 2,
    opacity: 0.85,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 2,
  },
  titleCard: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 26,
    lineHeight: 28,
    color: T.textOnSticker,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  titleThe: {
    color: "#9333EA",
  },
  tagline: {
    fontSize: 12,
    color: HomePalette.magenta,
    letterSpacing: 0.35,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  midRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  centerGap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelsHint: {
    fontSize: 10,
    color: "rgba(250,250,250,0.45)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  playZone: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
    zIndex: 12,
    gap: 2,
  },
  playKicker: {
    letterSpacing: 1,
  },
  playArrow: {
    marginBottom: 2,
    opacity: 0.9,
  },
  playGoal: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(250,250,250,0.72)",
    textAlign: "center",
    paddingHorizontal: 20,
    letterSpacing: 0.25,
  },
  statsHead: {
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.9,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
    paddingTop: 2,
  },
  version: {
    fontSize: 10,
    color: T.textMutedOnDark,
    letterSpacing: 0.35,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 2,
  },
});
