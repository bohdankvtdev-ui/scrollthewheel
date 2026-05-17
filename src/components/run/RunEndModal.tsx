import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Neo, neoPrimaryButtonStyle, neoTitleOnDark, neoSubtitleOnDark } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { RunPhase } from "../../schemas";

type RunEndModalProps = {
  phase: RunPhase;
  floor: number;
  onRestart: () => void;
  onContinueInfinite?: () => void;
};

const LOSS_COPY: Partial<Record<RunPhase, string>> = {
  lost_money: "Your bank hit $0 — run over",
  lost_blind: "Bank below cycle bonus target",
  lost_boss: "Boss ended the run",
};

export function RunEndModal({ phase, floor, onRestart, onContinueInfinite }: RunEndModalProps) {
  if (phase === "active") return null;

  const title =
    phase === "won"
      ? "Cycle cleared"
      : phase === "lost_money"
        ? "Broke"
        : phase === "lost_blind"
          ? "Missed bonus"
          : "Run over";

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={neoTitleOnDark(28)}>{title}</Text>
        <Text style={neoSubtitleOnDark(16)}>
          {phase === "won"
            ? `Cycle ${floor} complete — next cycle is harder`
            : LOSS_COPY[phase] ?? "Run ended"}
        </Text>
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
});
