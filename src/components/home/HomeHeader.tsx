import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { homeBrutalCard, HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";

type HomeHeaderProps = {
  title: string;
  tagline: string;
  version: string;
};

export function HomeHeader({ title, tagline, version }: HomeHeaderProps) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(20)} style={styles.block}>
      <View style={styles.topRow}>
        <View style={[homeBrutalCard(HomePalette.yellow, styles.titleCard)]}>
          <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} accessibilityRole="header">
            {title}
          </Text>
        </View>
        <Text style={[styles.version, { fontFamily: FONT_BEBAS_NEUE }]}>v{version}</Text>
      </View>
      <Text style={[styles.tagline, { fontFamily: FONT_BEBAS_NEUE }]}>{tagline}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
    paddingTop: 4,
    zIndex: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  titleCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 34,
    lineHeight: 36,
    color: T.textOnSticker,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  version: {
    fontSize: 11,
    color: T.textMutedOnDark,
    letterSpacing: 0.4,
    paddingTop: 6,
  },
  tagline: {
    fontSize: 16,
    color: HomePalette.magenta,
    letterSpacing: 0.45,
    paddingLeft: 2,
  },
});
