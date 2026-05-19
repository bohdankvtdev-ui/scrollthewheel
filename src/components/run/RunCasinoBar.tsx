import { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
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
import { isBankruptMoneyReveal, moneyRevealDurationMs } from "../../game/moneyReveal";
import type { RunState } from "../../schemas";
import { formatMoney } from "../../utils/formatMoney";

/** Brief red flash on bank total after a loss (ms). */
const LOSS_RED_HOLD_MS = 500;
const BANKRUPT_RED_HOLD_MS = 180;

const LOSS_MONEY = "#FF5C5C";

type MoneyReveal = { before: number; delta: number };

type RunCasinoBarProps = {
  run: RunState;
  moneyReveal?: MoneyReveal | null;
  onMoneyRevealDone?: () => void;
  shopHighlighted?: boolean;
  onShop: () => void;
  onYourWheel: () => void;
  onReset: () => void;
};

export function RunCasinoBar({
  run,
  moneyReveal = null,
  onMoneyRevealDone,
  shopHighlighted = false,
  onShop,
  onYourWheel,
  onReset,
}: RunCasinoBarProps) {
  const router = useRouter();
  const runChips = run.chipsEarnedThisRun ?? 0;
  const pulse = useSharedValue(1);
  const moneyPop = useSharedValue(1);
  const [shownMoney, setShownMoney] = useState(run.money);
  const [lossTintActive, setLossTintActive] = useState(false);
  const onDoneRef = useRef(onMoneyRevealDone);
  onDoneRef.current = onMoneyRevealDone;

  const revealKey =
    moneyReveal != null ? `${moneyReveal.before}:${moneyReveal.delta}` : null;
  const isLossReveal = moneyReveal != null && moneyReveal.delta < 0;

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

  useEffect(() => {
    if (revealKey == null) {
      setShownMoney(run.money);
      return;
    }

    const sep = revealKey.indexOf(":");
    const before = Number(revealKey.slice(0, sep));
    const delta = Number(revealKey.slice(sep + 1));
    const end = Math.max(0, before + delta);
    const isLoss = delta < 0;
    const isBankrupt = isBankruptMoneyReveal({ before, delta });
    const durationMs = moneyRevealDurationMs({ before, delta });
    let raf = 0;
    let finished = false;

    setShownMoney(before);
    setLossTintActive(false);

    moneyPop.value = withSequence(
      withTiming(1.1, { duration: isBankrupt ? 140 : 220 }),
      withTiming(1, { duration: isBankrupt ? 160 : 280 })
    );

    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShownMoney(Math.max(0, Math.round(before + delta * eased)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (finished) return;
      finished = true;
      setShownMoney(end);
      if (isLoss) setLossTintActive(true);
      onDoneRef.current?.();
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [revealKey, moneyPop]);

  useEffect(() => {
    if (!lossTintActive) return;
    const holdMs =
      moneyReveal != null && isBankruptMoneyReveal(moneyReveal)
        ? BANKRUPT_RED_HOLD_MS
        : LOSS_RED_HOLD_MS;
    const t = setTimeout(() => setLossTintActive(false), holdMs);
    return () => clearTimeout(t);
  }, [lossTintActive, moneyReveal]);

  const moneyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moneyPop.value }],
  }));

  const moneyColor = lossTintActive ? LOSS_MONEY : Neo.neonYellow;

  return (
    <View style={styles.wrap}>
      <View style={styles.chipBlock} accessibilityLabel={`${runChips} chips this run`}>
        <MaterialCommunityIcons name="poker-chip" size={18} color={Neo.neonCyan} />
        <Text style={[styles.chipVal, { fontFamily: FONT_BEBAS_NEUE }]}>{runChips}</Text>
      </View>
      <Animated.View style={[styles.moneyBlock, moneyAnimStyle]}>
        <Text style={[styles.moneyPrefix, { fontFamily: FONT_BEBAS_NEUE, color: moneyColor }]}>
          $
        </Text>
        <Text
          style={[styles.moneyVal, { fontFamily: FONT_BEBAS_NEUE, color: moneyColor }]}
          numberOfLines={1}
        >
          {formatMoney(moneyReveal != null ? shownMoney : run.money)}
        </Text>
        {moneyReveal != null ? (
          <Text
            style={[
              styles.moneyDelta,
              isLossReveal ? styles.moneyDeltaLoss : styles.moneyDeltaGain,
              { fontFamily: FONT_BEBAS_NEUE },
            ]}
          >
            {isLossReveal ? "−" : "+"}
            {formatMoney(Math.abs(moneyReveal.delta))}
          </Text>
        ) : null}
      </Animated.View>

      <Pressable
        style={styles.yourWheelBtn}
        onPress={onYourWheel}
        accessibilityLabel="Your Wheel — view slices and odds"
        hitSlop={6}
      >
        <MaterialIcons name="album" size={22} color={Neo.ink} />
      </Pressable>

      <View style={styles.shopWrap}>
        <Animated.View pointerEvents="none" style={[styles.shopHighlightRing, shopRingStyle]} />
        <Pressable
          style={[styles.shopBtn, shopHighlighted && styles.shopBtnHighlighted]}
          onPress={onShop}
          accessibilityLabel={shopHighlighted ? "Perk shop — tap to buy or reroll" : "Open shop"}
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moneyPrefix: {
    fontSize: 20,
    opacity: 0.85,
  },
  moneyVal: {
    fontSize: 28,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  moneyDelta: {
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  moneyDeltaGain: {
    color: Neo.neonCyan,
  },
  moneyDeltaLoss: {
    color: LOSS_MONEY,
  },
  yourWheelBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#22D3EE",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  shopWrap: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shopHighlightRing: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Neo.neonCyan,
    backgroundColor: "rgba(34,211,238,0.15)",
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
    backgroundColor: Neo.neonCyan,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: Neo.borderThin,
    borderColor: "rgba(255,255,255,0.15)",
  },
});
