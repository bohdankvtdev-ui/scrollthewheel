import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { homeKickerStyle, HomeScreenTheme as T } from "../../../theme/homeScreen";

export type HomeExploreItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ExploreCard({ item }: { item: HomeExploreItem }) {
  const press = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateX: press.value * 3 },
      { translateY: press.value * 3 },
    ],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: item.accent }, anim]}
      onPress={item.onPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 22, stiffness: 400 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.iconBubble}>
        <MaterialCommunityIcons name={item.icon as never} size={24} color={T.ink} />
      </View>
      <Text style={[styles.cardLabel, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={[styles.cardDesc, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={2}>
        {item.description}
      </Text>
    </AnimatedPressable>
  );
}

type HomeExploreGridProps = {
  items: HomeExploreItem[];
};

export function HomeExploreGrid({ items }: HomeExploreGridProps) {
  const pairs: HomeExploreItem[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }

  return (
    <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.block}>
      <Text style={[styles.section, homeKickerStyle(), { fontFamily: FONT_BEBAS_NEUE }]}>
        Explore
      </Text>
      <View style={styles.grid}>
        {pairs.map((row, ri) => (
          <View key={`row-${ri}`} style={styles.gridRow}>
            {row.map((item) => (
              <View key={item.id} style={styles.gridCell}>
                <ExploreCard item={item} />
              </View>
            ))}
            {row.length === 1 ? <View style={styles.gridCell} /> : null}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
    zIndex: 2,
  },
  section: {},
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  gridCell: {
    flex: 1,
  },
  card: {
    minHeight: 118,
    borderRadius: T.radius,
    borderWidth: T.borderBold,
    borderColor: T.ink,
    padding: 12,
    gap: 6,
    shadowColor: T.ink,
    shadowOffset: T.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 2,
    borderColor: T.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 15,
    color: T.ink,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  cardDesc: {
    fontSize: 10,
    lineHeight: 13,
    color: "rgba(26,26,26,0.72)",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
