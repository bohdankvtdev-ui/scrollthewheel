import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { VectorIcon } from "../../../lib/ui/VectorIcon";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PIT_STOP_OPTIONS, type PitStopOptionId } from "../../game/tactics/cyclePitStop";
import { ALPHA_CAMPAIGN_CYCLES } from "../../game/gdd";
import { getPermanentWedgeBonus, STARTING_WEDGE_COUNT } from "../../game/wheels/sliceCapacityBonus";
import { formatMoney } from "../../utils/formatMoney";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";

const PIT_SHORT: Record<PitStopOptionId, { label: string; value: string }> = {
  pit_laser: { label: "Laser", value: "+1" },
  pit_cash: { label: "Cash", value: "+$50" },
  pit_chips: { label: "Chips", value: "+10" },
};

type CycleClearOverlayProps = {
  run: RunState;
  onContinue: () => void;
  onContinueInfinite: () => void;
  onEndCampaign: () => void;
};

export function CycleClearOverlay({
  run,
  onContinue,
  onContinueInfinite,
  onEndCampaign,
}: CycleClearOverlayProps) {
  const applyPitStop = useRunStore((s) => s.applyPitStop);
  const pitPending = run.runEffects?.pitStopPending === true;
  const alphaChoice = run.runEffects?.alphaMilestonePending === true;
  const reward = run.lastCycleReward;
  const [pickedPitId, setPickedPitId] = useState<PitStopOptionId | null>(null);

  useEffect(() => {
    setPickedPitId(null);
  }, [pitPending, reward?.cycle, alphaChoice]);

  const nextCycle = run.floor + 1;
  const nextSlices = STARTING_WEDGE_COUNT + getPermanentWedgeBonus(run);
  const canContinue = !pitPending || pickedPitId != null;

  const handlePitPick = (id: PitStopOptionId) => {
    if (pickedPitId != null) return;
    applyPitStop(id);
    setPickedPitId(id);
  };

  if (reward == null) {
    return null;
  }

  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <Animated.View entering={FadeIn.duration(200)} style={styles.scrim} />

      <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.card}>
        <View style={styles.badge}>
          <MaterialIcons name="emoji-events" size={24} color={Neo.ink} />
        </View>

        <Text style={[styles.headline, { fontFamily: FONT_BEBAS_NEUE }]}>
          {alphaChoice ? `${ALPHA_CAMPAIGN_CYCLES} cycles cleared` : `Cycle ${reward.cycle}`}
        </Text>

        <Text style={[styles.rewardsLine, { fontFamily: FONT_BEBAS_NEUE }]}>
          +${reward.money} · +{reward.chips} chips
        </Text>
        <Text style={[styles.nextLine, { fontFamily: FONT_BEBAS_NEUE }]}>
          {alphaChoice
            ? `Bank ${formatMoney(run.money)} — keep climbing or end your run`
            : `Cycle ${nextCycle} · ${nextSlices} wedges`}
        </Text>

        {pitPending && !alphaChoice ? (
          <View style={styles.pitRow}>
            {PIT_STOP_OPTIONS.map((opt) => {
              const short = PIT_SHORT[opt.id];
              const isPicked = pickedPitId === opt.id;
              const dim = pickedPitId != null && !isPicked;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.pitChip, isPicked && styles.pitChipPicked, dim && styles.pitChipDim]}
                  onPress={() => handlePitPick(opt.id)}
                  disabled={pickedPitId != null}
                  accessibilityRole="button"
                  accessibilityLabel={`${short.label} ${short.value}`}
                >
                  <VectorIcon
                    name={opt.icon}
                    family={opt.iconFamily}
                    size={22}
                    color={isPicked ? Neo.neonYellow : Neo.neonCyan}
                  />
                  <Text style={[styles.pitLabel, { fontFamily: FONT_BEBAS_NEUE }]}>{short.label}</Text>
                  <Text style={[styles.pitValue, { fontFamily: FONT_BEBAS_NEUE }]}>{short.value}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {alphaChoice ? (
          <View style={styles.choiceRow}>
            <Pressable
              style={[styles.btn, styles.btnInfinite]}
              onPress={onContinueInfinite}
              accessibilityRole="button"
              accessibilityLabel="Continue infinite run"
            >
              <Text style={[styles.btnText, { fontFamily: FONT_BEBAS_NEUE }]}>Keep playing</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnEnd]}
              onPress={onEndCampaign}
              accessibilityRole="button"
              accessibilityLabel="End run"
            >
              <Text style={[styles.btnTextEnd, { fontFamily: FONT_BEBAS_NEUE }]}>End run</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={onContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !canContinue }}
          >
            <Text style={[styles.btnText, { fontFamily: FONT_BEBAS_NEUE }]}>Continue</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 220,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1A1228",
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    padding: 20,
    gap: 12,
  },
  badge: {
    alignSelf: "center",
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 28,
    color: Neo.neonYellow,
    textAlign: "center",
  },
  rewardsLine: {
    fontSize: 18,
    color: Neo.neonCyan,
    textAlign: "center",
  },
  nextLine: {
    fontSize: 14,
    color: "rgba(250,250,250,0.72)",
    textAlign: "center",
    lineHeight: 18,
  },
  pitRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  pitChip: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: Neo.borderThin,
    borderColor: "rgba(34,211,238,0.35)",
  },
  pitChipPicked: {
    borderColor: Neo.neonYellow,
    backgroundColor: "rgba(255,233,77,0.12)",
  },
  pitChipDim: {
    opacity: 0.45,
  },
  pitLabel: {
    fontSize: 13,
    color: Neo.textOnDark,
  },
  pitValue: {
    fontSize: 12,
    color: Neo.neonCyan,
  },
  choiceRow: {
    gap: 10,
    marginTop: 4,
  },
  btn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  btnInfinite: {
    backgroundColor: Neo.neonCyan,
  },
  btnEnd: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontSize: 18,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
  btnTextEnd: {
    fontSize: 18,
    color: Neo.textOnDark,
    letterSpacing: 0.3,
  },
});
