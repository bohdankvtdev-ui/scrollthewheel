import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Neo, neoPrimaryButtonStyle, neoSubtitleOnDark, neoTitleOnDark } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { ALPHA_CAMPAIGN_CYCLES } from "../../game/gdd";
import type { RunPhase } from "../../schemas";
import { formatMoney } from "../../utils/formatMoney";
import { useRankStore } from "../../stores/rankStore";

type RunEndModalProps = {
  phase: RunPhase;
  floor: number;
  money?: number;
  peakMoney?: number;
  onRestart: () => void;
  onContinueInfinite?: () => void;
  onWatchAd?: () => void;
};

const LOSS_COPY: Partial<Record<RunPhase, string>> = {
  lost_money: "Your bank hit $0 — this run is over",
  lost_blind: "Run ended",
  lost_boss: "Boss ended the run",
};

function BrokeSkullMark() {
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true
    );
    tilt.value = withRepeat(
      withSequence(withTiming(-6, { duration: 900 }), withTiming(6, { duration: 900 })),
      -1,
      true
    );
  }, [scale, tilt]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.skullWrap, anim]}>
      <MaterialCommunityIcons name="skull" size={52} color="#FCA5A5" />
      <View style={styles.skullCross}>
        <MaterialCommunityIcons name="skull-crossbones" size={22} color="#F87171" />
      </View>
    </Animated.View>
  );
}

export function RunEndModal({
  phase,
  floor,
  money = 0,
  peakMoney = 0,
  onRestart,
  onContinueInfinite,
  onWatchAd,
}: RunEndModalProps) {
  const rankOptIn = useRankStore((s) => s.prefs.leaderboardOptIn);
  const pendingCount = useRankStore((s) => s.pendingCount);
  const lastSubmit = useRankStore((s) => s.lastRunSubmitStatus);
  const connectivity = useRankStore((s) => s.connectivity);

  if (phase === "active") return null;

  const isLoss =
    phase === "lost_money" || phase === "lost_blind" || phase === "lost_boss";

  const title =
    phase === "alpha_won"
      ? "Campaign complete"
      : phase === "won"
        ? "Cycle cleared"
        : phase === "lost_money"
          ? "Broke"
          : phase === "lost_blind"
            ? "Missed bonus"
            : "Run over";

  const subtitle =
    phase === "alpha_won"
      ? `You cleared ${ALPHA_CAMPAIGN_CYCLES} cycles and ended your run`
      : phase === "won"
        ? `Cycle ${floor} complete — next cycle is harder`
        : LOSS_COPY[phase] ?? "Run ended";

  return (
    <View style={styles.overlay}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.scrim} />
      <Animated.View
        entering={FadeInDown.springify().damping(18).duration(340)}
        style={[styles.panel, isLoss && styles.panelLoss]}
      >
        {isLoss ? <BrokeSkullMark /> : null}
        <Text style={neoTitleOnDark(28)}>{title}</Text>
        <Text style={neoSubtitleOnDark(16)}>{subtitle}</Text>
        {isLoss ? (
          <Text style={[neoSubtitleOnDark(14), styles.peakLine]}>
            Peak bank {formatMoney(peakMoney)}
          </Text>
        ) : null}
        {isLoss && rankOptIn ? (
          <Text style={[neoSubtitleOnDark(13), styles.rankLine]}>
            {lastSubmit === "synced"
              ? "Score synced to global ranks"
              : lastSubmit === "queued" || pendingCount > 0
                ? connectivity === "offline"
                  ? "Score saved — will sync when online"
                  : "Uploading score to ranks…"
                : "Recorded for leaderboard"}
          </Text>
        ) : null}
        {phase === "alpha_won" ? (
          <Text style={[neoSubtitleOnDark(15), styles.stats]}>
            Bank {formatMoney(money)} · Peak {formatMoney(peakMoney)}
          </Text>
        ) : null}

        {isLoss ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnAd]}
            onPress={onWatchAd}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Watch ads to continue run"
          >
            <MaterialCommunityIcons name="play-circle-outline" size={20} color="rgba(250,250,250,0.75)" />
            <Text style={[styles.btnAdText, { fontFamily: FONT_BEBAS_NEUE }]}>
              Watch ads to continue run
            </Text>
            {onWatchAd == null ? (
              <Text style={[styles.soonTag, { fontFamily: FONT_BEBAS_NEUE }]}>Soon</Text>
            ) : null}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.btn} onPress={onRestart} activeOpacity={0.9}>
          <Text style={styles.btnText}>New Run</Text>
        </TouchableOpacity>
        {phase === "won" && onContinueInfinite != null ? (
          <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={onContinueInfinite} activeOpacity={0.9}>
            <Text style={styles.btnText}>Next cycle</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  panel: {
    backgroundColor: Neo.ink,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    borderRadius: Neo.radiusCard,
    padding: 24,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  panelLoss: {
    borderColor: "#7F1D1D",
    backgroundColor: "#120a14",
  },
  skullWrap: {
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  skullCross: {
    position: "absolute",
    right: -8,
    bottom: -4,
  },
  peakLine: {
    color: "rgba(250,250,250,0.5)",
    textAlign: "center",
  },
  rankLine: {
    color: Neo.neonCyan,
    textAlign: "center",
  },
  btn: {
    ...neoPrimaryButtonStyle(false),
    marginTop: 4,
    width: "100%",
  },
  btnAlt: {
    backgroundColor: Neo.neonCyan,
  },
  btnAd: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(250,250,250,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
  },
  btnAdText: {
    fontSize: 15,
    color: "rgba(250,250,250,0.78)",
    letterSpacing: 0.25,
  },
  soonTag: {
    fontSize: 9,
    color: Neo.neonYellow,
    letterSpacing: 0.5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
  },
  btnText: {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 18,
    color: Neo.ink,
  },
  stats: {
    textAlign: "center",
    color: Neo.neonCyan,
  },
});
