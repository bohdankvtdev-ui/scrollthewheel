import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo, neoPrimaryButtonStyle } from "../../../theme/neoBrutal";
import {
  bailoutChipCost,
  canUseDesperation,
  DESPERATION_META,
  type DesperationId,
} from "../../game/tactics/desperationTactics";
import { microChoiceChipCost } from "../../game/tactics/microChoices";
import { showRunInfoNotice, showRunNotice } from "../../game/notices/runNotices";
import { Ads } from "../../ads";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";

const TACTIC_STYLE: Record<DesperationId, string> = {
  reroll: "#FDBA74",
  bailout: "#4ADE80",
};

type RunDesperationOverlayProps = {
  run: RunState;
  offers: DesperationId[];
  onGiveUp: () => void;
  onWatchAd?: () => void;
};

function SkullPulse({ delayMs, size }: { delayMs: number; size: number }) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.14, { duration: 420 }),
          withTiming(0.92, { duration: 380 })
        ),
        -1,
        true
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 520 }),
          withTiming(8, { duration: 520 })
        ),
        -1,
        true
      );
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, rotate, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <MaterialCommunityIcons name="skull" size={size} color="#FCA5A5" />
    </Animated.View>
  );
}

export function RunDesperationOverlay({
  run,
  offers,
  onGiveUp,
  onWatchAd,
}: RunDesperationOverlayProps) {
  const useDesperationChoice = useRunStore((s) => s.useDesperationChoice);
  const hasSnapshot = useRunStore((s) => s.preSpinSnapshot != null);
  const offer = offers[0];

  const onPick = useCallback(
    (id: DesperationId) => {
      const result = useDesperationChoice(id);
      if (result.ok) {
        const meta = DESPERATION_META[id];
        showRunNotice({
          type: "success",
          title: meta.label,
          body: meta.chosen,
          icon: meta.icon,
        });
      } else {
        showRunInfoNotice(result.reason);
      }
    },
    [useDesperationChoice]
  );

  const onWatchAdPress = useCallback(() => {
    if (onWatchAd != null) {
      void onWatchAd();
      return;
    }
    if (!Ads.isRewardedReady()) {
      showRunInfoNotice("Ad not available — try again in a moment");
      return;
    }
    void Ads.showRewarded().then((earned) => {
      if (!earned) showRunInfoNotice("Ad not available — try again in a moment");
    });
  }, [onWatchAd]);

  if (offer == null) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(220)} style={styles.scrim} pointerEvents="auto" />
      <Animated.View entering={FadeInDown.springify().damping(18).duration(360)} style={styles.panel}>
        <View style={styles.skullRow}>
          <SkullPulse delayMs={0} size={28} />
          <SkullPulse delayMs={120} size={36} />
          <SkullPulse delayMs={240} size={28} />
        </View>

        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>Last chance</Text>
        <Text style={styles.subtitle}>Bank hit $0 — spend chips to stay alive or give up the run</Text>

        <DesperationOfferButton
          id={offer}
          run={run}
          offers={offers}
          hasSnapshot={hasSnapshot}
          onPress={() => onPick(offer)}
        />

        <Pressable
          style={({ pressed }) => [styles.adBtn, pressed && styles.adBtnPressed]}
          onPress={onWatchAdPress}
          accessibilityRole="button"
          accessibilityLabel="Watch ads to continue run"
        >
          <MaterialCommunityIcons name="play-circle-outline" size={20} color="rgba(250,250,250,0.7)" />
          <Text style={[styles.adBtnText, { fontFamily: FONT_BEBAS_NEUE }]}>
            Watch ads to continue run
          </Text>
          {onWatchAd == null ? (
            <View style={styles.soonBadge}>
              <Text style={[styles.soonText, { fontFamily: FONT_BEBAS_NEUE }]}>Ad</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          onPress={onGiveUp}
          style={({ pressed }) => [styles.giveUpBtn, pressed && styles.giveUpPressed]}
          accessibilityRole="button"
          accessibilityLabel="Give up run"
        >
          <MaterialCommunityIcons name="skull-crossbones" size={18} color="#FECACA" />
          <Text style={[styles.giveUpText, { fontFamily: FONT_BEBAS_NEUE }]}>Give up</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const DesperationOfferButton = memo(function DesperationOfferButton({
  id,
  run,
  offers,
  hasSnapshot,
  onPress,
}: {
  id: DesperationId;
  run: RunState;
  offers: DesperationId[];
  hasSnapshot: boolean;
  onPress: () => void;
}) {
  const meta = DESPERATION_META[id];
  const cost = useMemo(
    () => (id === "reroll" ? microChoiceChipCost(run, "reroll") : bailoutChipCost(run)),
    [id, run]
  );
  const check = canUseDesperation(run, id, { hasPreSpinSnapshot: hasSnapshot, offers });
  const disabled = !check.ok;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.offerBtn,
        { backgroundColor: disabled ? "#E8E4DC" : TACTIC_STYLE[id] },
        pressed && !disabled && styles.offerPressed,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}. ${meta.pickerHint}. ${cost} chips`}
    >
      <View style={[styles.offerIcon, disabled && styles.offerIconDisabled]}>
        <MaterialCommunityIcons
          name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={26}
          color={disabled ? "rgba(10,10,10,0.28)" : Neo.ink}
        />
      </View>
      <View style={styles.offerCopy}>
        <Text style={[styles.offerTitle, { fontFamily: FONT_BEBAS_NEUE }]}>{meta.label}</Text>
        <Text style={styles.offerHint}>{meta.pickerHint}</Text>
      </View>
      <View style={styles.costPill}>
        <MaterialCommunityIcons name="poker-chip" size={12} color={Neo.ink} />
        <Text style={[styles.costText, { fontFamily: FONT_BEBAS_NEUE }]}>{cost}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 95,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,4,14,0.82)",
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#140c1c",
    borderWidth: Neo.borderBold,
    borderColor: Neo.neonYellow,
    borderRadius: Neo.radiusCard,
    padding: 20,
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  skullRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 2,
  },
  title: {
    fontSize: 32,
    color: Neo.neonYellow,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: "rgba(250,250,250,0.62)",
    textAlign: "center",
    marginBottom: 4,
  },
  offerBtn: {
    width: "100%",
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
  },
  offerPressed: {
    opacity: 0.9,
  },
  offerIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  offerIconDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  offerCopy: {
    flex: 1,
    gap: 2,
  },
  offerTitle: {
    fontSize: 20,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
  offerHint: {
    fontSize: 12,
    lineHeight: 14,
    color: "rgba(10,10,10,0.72)",
  },
  costPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  costText: {
    fontSize: 12,
    color: Neo.ink,
  },
  adBtn: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 11,
    borderWidth: Neo.borderBold,
    borderColor: "rgba(250,250,250,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  adBtnPressed: {
    opacity: 0.88,
  },
  adBtnText: {
    fontSize: 15,
    color: "rgba(250,250,250,0.72)",
    letterSpacing: 0.25,
  },
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(250,204,21,0.2)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.45)",
  },
  soonText: {
    fontSize: 9,
    color: Neo.neonYellow,
    letterSpacing: 0.4,
  },
  giveUpBtn: {
    width: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 11,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: "rgba(127,29,29,0.55)",
  },
  giveUpPressed: {
    opacity: 0.88,
  },
  giveUpText: {
    fontSize: 16,
    color: "#FECACA",
    letterSpacing: 0.35,
  },
});
