import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Neo, neoPrimaryButtonStyle, neoTitleOnDark, neoSubtitleOnDark } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { ALPHA_CAMPAIGN_CYCLES } from "../../game/gdd";
import type { RunPhase } from "../../schemas";
import { formatMoney } from "../../utils/formatMoney";

type RunEndModalProps = {
  phase: RunPhase;
  floor: number;
  money?: number;
  peakMoney?: number;
  onRestart: () => void;
  onContinueInfinite?: () => void;
};

const LOSS_COPY: Partial<Record<RunPhase, string>> = {
  lost_money: "Bank hit $0 — run over",
  lost_blind: "Run ended",
  lost_boss: "Boss ended the run",
};

export function RunEndModal({
  phase,
  floor,
  money = 0,
  peakMoney = 0,
  onRestart,
  onContinueInfinite,
}: RunEndModalProps) {
  if (phase === "active") return null;

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
      <View style={styles.panel}>
        <Text style={neoTitleOnDark(28)}>{title}</Text>
        <Text style={neoSubtitleOnDark(16)}>{subtitle}</Text>
        {phase === "alpha_won" ? (
          <Text style={[neoSubtitleOnDark(15), styles.stats]}>
            Bank {formatMoney(money)} · Peak {formatMoney(peakMoney)}
          </Text>
        ) : null}
        <TouchableOpacity style={styles.btn} onPress={onRestart} activeOpacity={0.9}>
          <Text style={styles.btnText}>New Run</Text>
        </TouchableOpacity>
        {phase === "won" && onContinueInfinite != null ? (
          <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={onContinueInfinite} activeOpacity={0.9}>
            <Text style={styles.btnText}>Next cycle</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
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
  },
  btn: {
    ...neoPrimaryButtonStyle(false),
    marginTop: 8,
    width: "100%",
  },
  btnAlt: {
    backgroundColor: Neo.neonCyan,
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
