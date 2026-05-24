import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { homeKickerStyle, HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";
import { formatMoney } from "../../utils/formatMoney";
import type { HomeGoal } from "./homeGoal";

type HomeStatsRowProps = {
  bestFloor: number;
  bestPeakMoney: number;
  totalRuns: number;
  goal: HomeGoal;
  compactGoal?: boolean;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={[styles.cellLabel, homeKickerStyle(), { fontFamily: FONT_BEBAS_NEUE }]}>{label}</Text>
      <Text style={[styles.cellValue, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function HomeStatsRow({
  bestFloor,
  bestPeakMoney,
  totalRuns,
  goal,
  compactGoal = false,
}: HomeStatsRowProps) {
  return (
    <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.block}>
      <View style={styles.row}>
        <StatCell label="Best bank" value={bestPeakMoney > 0 ? formatMoney(bestPeakMoney) : "—"} />
        <View style={styles.divider} />
        <StatCell label="Best cycle" value={bestFloor > 0 ? String(bestFloor) : "—"} />
        <View style={styles.divider} />
        <StatCell label="Runs" value={String(totalRuns)} />
      </View>
      {compactGoal ? (
        <View style={styles.goalStrip}>
          <Text style={[styles.goalHead, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {goal.headline}
          </Text>
          <Text style={styles.goalDetail} numberOfLines={2}>
            {goal.detail}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
    zIndex: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.12)",
    overflow: "hidden",
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  cellLabel: {
    fontSize: 9,
    color: HomePalette.cyan,
  },
  cellValue: {
    fontSize: 17,
    color: T.textOnDark,
    letterSpacing: 0.25,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(250,250,250,0.1)",
    marginVertical: 8,
  },
  goalStrip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: HomePalette.yellow,
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 4,
  },
  goalHead: {
    fontSize: 15,
    color: T.textOnDark,
    letterSpacing: 0.35,
  },
  goalDetail: {
    fontSize: 13,
    lineHeight: 17,
    color: T.textMutedOnDark,
  },
});
