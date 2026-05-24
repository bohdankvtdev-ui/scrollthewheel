import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { homeBrutalCard, homeKickerStyle, HomeScreenTheme as T } from "../../../theme/homeScreen";

export type HomeLearnTile = {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  tint: string;
  iconBg: string;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Tile({ tile }: { tile: HomeLearnTile }) {
  const press = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateX: press.value * 3 },
      { translateY: press.value * 3 },
    ],
    shadowOffset: {
      width: T.shadowHard.width - press.value * 3,
      height: T.shadowHard.height - press.value * 3,
    },
  }));

  return (
    <AnimatedPressable
      style={[homeBrutalCard(tile.tint, styles.tile), anim]}
      onPress={tile.onPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 22, stiffness: 400 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={tile.label}
    >
      <View style={[styles.iconWrap, { backgroundColor: tile.iconBg }]}>
        <MaterialCommunityIcons name={tile.icon as never} size={22} color={T.ink} />
      </View>
      <View style={styles.tileText}>
        <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
          {tile.label}
        </Text>
        {tile.subtitle ? (
          <Text style={[styles.sub, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {tile.subtitle}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={T.ink} style={styles.chevron} />
    </AnimatedPressable>
  );
}

type HomeLearnTilesProps = {
  tiles: HomeLearnTile[];
};

export function HomeLearnTiles({ tiles }: HomeLearnTilesProps) {
  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.block}>
      <Text style={[styles.section, homeKickerStyle(), { fontFamily: FONT_BEBAS_NEUE }]}>
        Guides
      </Text>
      <View style={styles.list}>
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
  },
  section: {},
  list: {
    gap: 8,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: T.borderThin,
    borderColor: T.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  label: {
    fontSize: 16,
    color: T.ink,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  sub: {
    fontSize: 10,
    color: T.textMutedSticker,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  chevron: {
    opacity: 0.65,
  },
});
