import { useEffect, useRef, useState } from "react";
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
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { isBankruptMoneyReveal, moneyRevealDurationMs } from "../../game/moneyReveal";
import type { RunState } from "../../schemas";
import { formatMoney } from "../../utils/formatMoney";

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
  onReset: () => void;
};

export function RunCasinoBar({
  run,
  moneyReveal = null,
  onMoneyRevealDone,
  shopHighlighted = false,
  onShop,
  onReset,
}: RunCasinoBarProps) {
  const router = useRouter();
  const chrome = useRunChromeMetrics();
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
      withSequence(withTiming(1.1, { duration: 520 }), withTiming(1, { duration: 520 })),
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
    setShownMoney(run.money);
    setLossTintActive(false);
  }, [run.runId]);

  useEffect(() => {
    if (revealKey == null) {
      setShownMoney(run.money);
      return;
    }

    const sep = revealKey.indexOf(":");
    const before = Number(revealKey.slice(0, sep));
    const delta = Number(revealKey.slice(sep + 1));
    const end = Math.max(0, before + delta);
    const isBankrupt = isBankruptMoneyReveal({ before, delta });
    const durationMs = moneyRevealDurationMs({ before, delta });
    let raf = 0;
    let finished = false;

    setShownMoney(before);
    setLossTintActive(false);

    moneyPop.value = withSequence(
      withTiming(1.08, { duration: isBankrupt ? 140 : 220 }),
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
      if (delta < 0) setLossTintActive(true);
      onDoneRef.current?.();
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
  const actionSize = chrome.bar.actionSize;

  return (
    <View
      style={[
        styles.wrap,
        {
          minHeight: chrome.bar.minHeight,
          paddingHorizontal: chrome.bar.padH,
        },
      ]}
    >
      <Animated.View style={[styles.moneyBlock, moneyAnimStyle]}>
        <Text
          style={[
            styles.moneyPrefix,
            {
              fontFamily: FONT_BEBAS_NEUE,
              color: moneyColor,
              fontSize: chrome.bar.moneyPrefixSize,
            },
          ]}
        >
          $
        </Text>
        <Text
          style={[
            styles.moneyVal,
            {
              fontFamily: FONT_BEBAS_NEUE,
              color: moneyColor,
              fontSize: chrome.bar.moneySize,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {formatMoney(moneyReveal != null ? shownMoney : run.money)}
        </Text>
        {moneyReveal != null ? (
          <Text
            style={[
              styles.moneyDelta,
              isLossReveal ? styles.moneyDeltaLoss : styles.moneyDeltaGain,
              { fontFamily: FONT_BEBAS_NEUE, fontSize: chrome.bar.deltaFontSize },
            ]}
            numberOfLines={1}
          >
            {isLossReveal ? "−" : "+"}
            {formatMoney(Math.abs(moneyReveal.delta))}
          </Text>
        ) : null}
      </Animated.View>

      <View style={styles.actions}>
        <View style={[styles.shopWrap, { width: actionSize, height: actionSize }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shopHighlightRing,
              shopRingStyle,
              { width: actionSize + 4, height: actionSize + 4, borderRadius: 10 },
            ]}
          />
          <Pressable
            style={[
              styles.actionBtn,
              styles.shopBtn,
              { width: actionSize, height: actionSize },
              shopHighlighted && styles.shopBtnHighlighted,
            ]}
            onPress={onShop}
            accessibilityLabel={shopHighlighted ? "Perk shop" : "Open shop"}
            accessibilityState={{ selected: shopHighlighted }}
            hitSlop={6}
          >
            <MaterialIcons name="storefront" size={chrome.bar.iconSize} color={Neo.ink} />
          </Pressable>
        </View>
        <Pressable
          style={[styles.actionBtn, { width: actionSize, height: actionSize }]}
          onPress={() => router.push("/")}
          accessibilityLabel="Menu"
          hitSlop={6}
        >
          <MaterialIcons name="home" size={chrome.bar.iconSize} color={Neo.textOnDark} />
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { width: actionSize, height: actionSize }]}
          onPress={onReset}
          accessibilityLabel="Reset run"
          hitSlop={6}
        >
          <MaterialIcons name="logout" size={chrome.bar.iconSize - 2} color={Neo.textOnDark} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Neo.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  moneyBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    minWidth: 0,
    gap: 2,
  },
  moneyPrefix: {
    opacity: 0.88,
  },
  moneyVal: {
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  moneyDelta: {
    marginLeft: 4,
    letterSpacing: 0.25,
    flexShrink: 0,
  },
  moneyDeltaGain: {
    color: Neo.neonCyan,
  },
  moneyDeltaLoss: {
    color: LOSS_MONEY,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  shopWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  shopHighlightRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: Neo.neonCyan,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  actionBtn: {
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  shopBtn: {
    backgroundColor: Neo.neonYellow,
    borderWidth: 1.5,
    borderColor: Neo.ink,
  },
  shopBtnHighlighted: {
    backgroundColor: Neo.neonCyan,
  },
});
