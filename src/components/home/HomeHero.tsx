import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import {
  homeBodyOnSticker,
  homeBrutalCard,
  homeKickerStyle,
  HomePalette,
  HomeScreenTheme as T,
} from "../../../theme/homeScreen";
import type { HomeGoal } from "./homeGoal";

const ACCENT: Record<HomeGoal["accent"], string> = {
  yellow: HomePalette.yellow,
  cyan: HomePalette.cyan,
  magenta: HomePalette.magenta,
};

type HomeHeroProps = {
  title: string;
  tagline: string;
  goal: HomeGoal;
  /** When a saved run exists, skip the mission card (resume chip covers it). */
  hideMission?: boolean;
};

export function HomeHero({ title, tagline, goal, hideMission = false }: HomeHeroProps) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(20)} style={styles.block}>
      <View style={[styles.titleSticker, homeBrutalCard(HomePalette.yellow, { padding: 14 })]}>
        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Text style={[styles.tagline, { fontFamily: FONT_BEBAS_NEUE }]}>{tagline}</Text>

      {!hideMission ? (
        <View
          style={[
            homeBrutalCard(HomePalette.cyan),
            styles.mission,
            { borderLeftColor: ACCENT[goal.accent], borderLeftWidth: 6 },
          ]}
        >
          <Text
            style={[
              styles.missionKicker,
              homeKickerStyle(),
              { fontFamily: FONT_BEBAS_NEUE, color: T.ink },
            ]}
          >
            Goal
          </Text>
          <Text style={[styles.missionHead, { fontFamily: FONT_BEBAS_NEUE }]}>{goal.headline}</Text>
          <Text style={[styles.missionBody, homeBodyOnSticker()]}>{goal.detail}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 12,
    paddingTop: 12,
    zIndex: 2,
  },
  titleSticker: {
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 38,
    lineHeight: 40,
    color: T.textOnSticker,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  tagline: {
    fontSize: 17,
    color: HomePalette.magenta,
    letterSpacing: 0.5,
    paddingLeft: 2,
  },
  mission: {},
  missionKicker: {
    opacity: 0.9,
  },
  missionHead: {
    fontSize: 20,
    color: T.textOnSticker,
    letterSpacing: 0.3,
  },
  missionBody: {},
});
