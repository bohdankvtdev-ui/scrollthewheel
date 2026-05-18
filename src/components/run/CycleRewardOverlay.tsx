import { useEffect } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { getSliceCountForCycle } from "../../game/cycle/cycleProgression";

type CycleRewardOverlayProps = {
  run: RunState;
  onContinue: () => void;
};

export function CycleRewardOverlay({ run, onContinue }: CycleRewardOverlayProps) {
  const reward = run.lastCycleReward;
  const nextCycle = run.floor + 1;
  const nextSlices = getSliceCountForCycle(nextCycle);

  useEffect(() => {
    const t = setTimeout(onContinue, 3200);
    return () => clearTimeout(t);
  }, [onContinue, reward.cycle]);

  if (reward == null) return null;

  return (
    <Pressable style={styles.backdrop} onPress={onContinue} accessibilityRole="button">
      <Animated.View entering={FadeIn.duration(220)} style={styles.scrim} />
      <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.card}>
        <View style={styles.badge}>
          <MaterialIcons name="emoji-events" size={28} color={Neo.ink} />
        </View>
        <Text style={[styles.headline, { fontFamily: FONT_BEBAS_NEUE }]}>
          Cycle {reward.cycle} cleared
        </Text>
        <Text style={[styles.sub, { fontFamily: FONT_BEBAS_NEUE }]}>
          Rewards added to your run
        </Text>

        <View style={styles.rewardRow}>
          <MaterialIcons name="attach-money" size={22} color={Neo.neonYellow} />
          <Text style={[styles.rewardVal, { fontFamily: FONT_BEBAS_NEUE }]}>
            +${reward.money}
          </Text>
        </View>
        <View style={styles.rewardRow}>
          <MaterialCommunityIcons name="poker-chip" size={22} color={Neo.neonCyan} />
          <Text style={[styles.rewardVal, { fontFamily: FONT_BEBAS_NEUE }]}>
            +{reward.chips} shop chips
          </Text>
        </View>

        <Text style={[styles.nextLine, { fontFamily: FONT_BEBAS_NEUE }]}>
          Cycle {nextCycle} · {nextSlices} wedges per wheel
        </Text>

        <Pressable style={styles.btn} onPress={onContinue}>
          <Text style={[styles.btnText, { fontFamily: FONT_BEBAS_NEUE }]}>Continue</Text>
        </Pressable>
        <Text style={styles.hint}>Tap anywhere · auto-continues in 3s</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Neo.ink,
    borderWidth: Neo.borderBold,
    borderColor: Neo.neonYellow,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 32,
    color: Neo.neonYellow,
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 14,
    color: "rgba(250,250,250,0.65)",
    marginBottom: 8,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
  },
  rewardVal: {
    fontSize: 22,
    color: Neo.textOnDark,
  },
  nextLine: {
    fontSize: 13,
    color: Neo.neonCyan,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  btn: {
    marginTop: 12,
    width: "100%",
    paddingVertical: 14,
    backgroundColor: Neo.neonCyan,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    fontSize: 20,
    color: Neo.ink,
  },
  hint: {
    fontSize: 11,
    color: "rgba(250,250,250,0.45)",
    marginTop: 4,
  },
});
