import { MaterialCommunityIcons, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { Neo } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { RunUiEffect } from "../../stores/runStore";
import type { IconFamily } from "../../schemas";

type RunEffectsDockProps = {
  effect: RunUiEffect | null;
  awaitingClaim: boolean;
  isSpinning: boolean;
};

function DockGlyph({
  family,
  name,
}: {
  family: IconFamily;
  name: string;
}) {
  if (family === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={24}
        color={Neo.ink}
      />
    );
  }
  if (family === "Ionicons") {
    return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={24} color={Neo.ink} />;
  }
  return <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={24} color={Neo.ink} />;
}

function EffectRow({
  effect,
  showClaimCue,
}: {
  effect: RunUiEffect;
  showClaimCue: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconChip, { backgroundColor: effect.accent }]}>
        <DockGlyph family={effect.iconFamily} name={effect.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
          {effect.shortLabel}
        </Text>
        <Text style={styles.hint} numberOfLines={1}>
          {effect.effectHint}
        </Text>
      </View>
      {showClaimCue ? (
        <MaterialIcons name="keyboard-double-arrow-down" size={26} color={Neo.neonYellow} />
      ) : (
        <View style={styles.cueSpacer} />
      )}
    </View>
  );
}

export function RunEffectsDock({ effect, awaitingClaim, isSpinning }: RunEffectsDockProps) {
  const showClaim = awaitingClaim && effect != null;
  const showSpinning = isSpinning;
  const showEffectOnly = !awaitingClaim && !isSpinning && effect != null;
  const showIdle = !showClaim && !showSpinning && !showEffectOnly;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>Last effect</Text>
      <View style={styles.slot}>
        {showClaim && effect != null ? <EffectRow effect={effect} showClaimCue /> : null}
        {showEffectOnly && effect != null ? (
          <EffectRow effect={effect} showClaimCue={false} />
        ) : null}
        {showSpinning ? (
          <View style={styles.placeholder}>
            <MaterialIcons name="autorenew" size={20} color={Neo.neonCyan} />
            <Text style={[styles.placeholderText, { fontFamily: FONT_BEBAS_NEUE }]}>Spinning…</Text>
          </View>
        ) : null}
        {showIdle ? (
          <View style={styles.placeholder}>
            <MaterialIcons name="touch-app" size={20} color="rgba(250,250,250,0.45)" />
            <Text style={styles.placeholderText}>Tap center to spin</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.effectsDock,
    borderTopWidth: Neo.borderBold,
    borderTopColor: Neo.ink,
    backgroundColor: Neo.surfaceDark,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
  },
  label: {
    fontSize: 10,
    color: Neo.neonCyan,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  slot: {
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 1,
  },
  title: {
    fontSize: 17,
    color: Neo.textOnDark,
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12,
    color: "rgba(250,250,250,0.7)",
  },
  placeholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
  },
  placeholderText: {
    fontSize: 14,
    color: "rgba(250,250,250,0.5)",
  },
  cueSpacer: {
    width: 26,
  },
});
