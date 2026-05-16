import { useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { formatMoney } from "../../utils/formatMoney";

type RunCasinoBarProps = {
  run: RunState;
  shopHighlighted?: boolean;
  onShop: () => void;
  onReset: () => void;
};

export function RunCasinoBar({ run, shopHighlighted = false, onShop, onReset }: RunCasinoBarProps) {
  const router = useRouter();
  const runChips = run.chipsEarnedThisRun ?? 0;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!shopHighlighted) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 520 }), withTiming(1, { duration: 520 })),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [shopHighlighted, pulse]);

  const shopRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: shopHighlighted ? 1 : 0,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.chipBlock} accessibilityLabel={`${runChips} chips this run`}>
        <MaterialIcons name="toll" size={16} color={Neo.neonCyan} />
        <Text style={[styles.chipVal, { fontFamily: FONT_BEBAS_NEUE }]}>{runChips}</Text>
      </View>
      <View style={styles.moneyBlock}>
        <Text style={[styles.moneyPrefix, { fontFamily: FONT_BEBAS_NEUE }]}>$</Text>
        <Text style={[styles.moneyVal, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
          {formatMoney(run.money)}
        </Text>
      </View>

      <View style={styles.slicePill} accessibilityLabel={`${run.sliceCapacity} slices`}>
        <Text style={[styles.sliceText, { fontFamily: FONT_BEBAS_NEUE }]}>
          {run.sliceCapacity}
          {run.pendingWheelRebuild ? "→" : ""}
        </Text>
      </View>

      {(run.shields ?? 0) > 0 ? (
        <View style={styles.shieldPill}>
          <MaterialIcons name="shield" size={14} color={Neo.ink} />
          <Text style={[styles.shieldText, { fontFamily: FONT_BEBAS_NEUE }]}>{run.shields}</Text>
        </View>
      ) : null}

      <View style={styles.shopWrap}>
        <Animated.View pointerEvents="none" style={[styles.shopHighlightRing, shopRingStyle]} />
        <Pressable
          style={[styles.shopBtn, shopHighlighted && styles.shopBtnHighlighted]}
          onPress={onShop}
          accessibilityLabel={shopHighlighted ? "Joker shop — tap to buy or reroll" : "Open shop"}
          accessibilityState={{ selected: shopHighlighted }}
          hitSlop={6}
        >
          <MaterialIcons name="storefront" size={22} color={Neo.ink} />
        </Pressable>
      </View>

      <Pressable style={styles.iconBtn} onPress={onReset} accessibilityLabel="Reset run" hitSlop={6}>
        <MaterialIcons name="refresh" size={20} color={Neo.textOnDark} />
      </Pressable>
      <Pressable
        style={styles.iconBtn}
        onPress={() => router.push("/")}
        accessibilityLabel="Menu"
        hitSlop={6}
      >
        <MaterialIcons name="home" size={20} color={Neo.textOnDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.bar,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: Neo.headerBg,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
  },
  chipBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    height: 32,
    backgroundColor: "rgba(34,211,238,0.15)",
    borderRadius: 8,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(34,211,238,0.4)",
  },
  chipVal: {
    fontSize: 16,
    color: Neo.neonCyan,
    letterSpacing: 0.3,
  },
  moneyBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  moneyPrefix: {
    fontSize: 20,
    color: Neo.neonYellow,
    opacity: 0.85,
  },
  moneyVal: {
    fontSize: 28,
    color: Neo.neonYellow,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  slicePill: {
    minWidth: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neo.neonCyan,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  sliceText: {
    fontSize: 15,
    color: Neo.ink,
  },
  shieldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 32,
    paddingHorizontal: 8,
    backgroundColor: "#FEF9C3",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 8,
  },
  shieldText: {
    fontSize: 14,
    color: Neo.ink,
  },
  shopWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shopHighlightRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: Neo.borderBold,
    borderColor: Neo.neonCyan,
    backgroundColor: "rgba(34,211,238,0.2)",
  },
  shopBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  shopBtnHighlighted: {
    backgroundColor: "#FFF566",
    borderColor: Neo.neonCyan,
    borderWidth: Neo.borderBold + 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
