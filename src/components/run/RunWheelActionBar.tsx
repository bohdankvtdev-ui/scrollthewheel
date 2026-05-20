import { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { chipRevealDurationMs, type ChipReveal } from "../../game/chipReveal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { RUN_PAGE_BACKGROUND } from "../../game/runVisual";
import type { RunState } from "../../schemas";

type RunWheelActionBarProps = {
  run: RunState;
  chipReveal?: ChipReveal | null;
  onChipRevealDone?: () => void;
  onYourWheel: () => void;
};

/** Chips + Your Wheel — sits below the wheel, above “Tap to spin”. */
export function RunWheelActionBar({
  run,
  chipReveal = null,
  onChipRevealDone,
  onYourWheel,
}: RunWheelActionBarProps) {
  const chrome = useRunChromeMetrics();
  const chipPop = useSharedValue(1);
  const glow = useSharedValue(0);
  const [shownChips, setShownChips] = useState(run.chipsEarnedThisRun ?? 0);
  const [gainFlash, setGainFlash] = useState(false);
  const onDoneRef = useRef(onChipRevealDone);
  onDoneRef.current = onChipRevealDone;

  const revealKey = chipReveal != null ? `${chipReveal.before}:${chipReveal.delta}` : null;

  useEffect(() => {
    if (revealKey == null) {
      setShownChips(run.chipsEarnedThisRun ?? 0);
      return;
    }

    const sep = revealKey.indexOf(":");
    const before = Number(revealKey.slice(0, sep));
    const delta = Number(revealKey.slice(sep + 1));
    const end = Math.max(0, before + delta);
    const durationMs = chipRevealDurationMs(chipReveal);
    let raf = 0;
    let finished = false;

    setShownChips(before);
    setGainFlash(false);

    chipPop.value = withSequence(
      withTiming(1.14, { duration: 160 }),
      withTiming(1, { duration: 240 })
    );
    glow.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 520 }));

    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShownChips(Math.max(0, Math.round(before + delta * eased)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (finished) return;
      finished = true;
      setShownChips(end);
      setGainFlash(true);
      onDoneRef.current?.();
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealKey, chipPop, glow, chipReveal]);

  useEffect(() => {
    if (!gainFlash) return;
    const t = setTimeout(() => setGainFlash(false), 420);
    return () => clearTimeout(t);
  }, [gainFlash]);

  const chipAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chipPop.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.85,
  }));

  const displayChips = chipReveal != null ? shownChips : run.chipsEarnedThisRun ?? 0;

  return (
    <View
      style={[
        styles.wrap,
        {
          minHeight: chrome.wheelHud.minHeight,
          paddingHorizontal: chrome.wheelHud.padH,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.chipBlock,
          chipAnimStyle,
          gainFlash && styles.chipBlockGain,
        ]}
        accessibilityLabel={`${displayChips} chips`}
      >
        <Animated.View pointerEvents="none" style={[styles.chipGlow, glowStyle]} />
        <MaterialCommunityIcons name="poker-chip" size={20} color={Neo.neonCyan} />
        <Text style={[styles.chipVal, { fontFamily: FONT_BEBAS_NEUE }]}>{displayChips}</Text>
        {chipReveal != null && chipReveal.delta > 0 ? (
          <Text style={[styles.chipDelta, { fontFamily: FONT_BEBAS_NEUE }]}>
            +{chipReveal.delta}
          </Text>
        ) : null}
      </Animated.View>
      <View style={styles.spacer} />
      <Pressable
        style={styles.yourWheelBtn}
        onPress={onYourWheel}
        accessibilityLabel="Your Wheel — view slices and odds"
        hitSlop={8}
      >
        <MaterialIcons name="album" size={22} color={Neo.ink} />
        <Text style={[styles.yourWheelLbl, { fontFamily: FONT_BEBAS_NEUE }]}>Your wheel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RUN_PAGE_BACKGROUND,
  },
  chipBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(34,211,238,0.14)",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(34,211,238,0.45)",
    overflow: "hidden",
  },
  chipBlockGain: {
    borderColor: Neo.neonCyan,
    backgroundColor: "rgba(34,211,238,0.28)",
  },
  chipGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(34,211,238,0.35)",
  },
  chipVal: {
    fontSize: 20,
    color: Neo.neonCyan,
    letterSpacing: 0.35,
  },
  chipDelta: {
    fontSize: 14,
    color: "#67E8F9",
    letterSpacing: 0.3,
    marginLeft: 2,
  },
  spacer: {
    flex: 1,
  },
  yourWheelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Neo.neonCyan,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.35)",
  },
  yourWheelLbl: {
    fontSize: 15,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
});
