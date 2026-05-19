import { useEffect, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PIT_STOP_OPTIONS, type PitStopOptionId } from "../../game/tactics/cyclePitStop";
import { getPermanentWedgeBonus, STARTING_WEDGE_COUNT } from "../../game/wheels/sliceCapacityBonus";
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
};

export function CycleClearOverlay({ run, onContinue }: CycleClearOverlayProps) {
  const applyPitStop = useRunStore((s) => s.applyPitStop);
  const pitPending = run.runEffects?.pitStopPending === true;
  const reward = run.lastCycleReward;
  const [pickedPitId, setPickedPitId] = useState<PitStopOptionId | null>(null);

  useEffect(() => {
    setPickedPitId(null);
  }, [pitPending, reward?.cycle]);

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
          Cycle {reward.cycle}
        </Text>

        <Text style={[styles.rewardsLine, { fontFamily: FONT_BEBAS_NEUE }]}>
          +${reward.money} · +{reward.chips} chips
        </Text>
        <Text style={[styles.nextLine, { fontFamily: FONT_BEBAS_NEUE }]}>
          Cycle {nextCycle} · {nextSlices} wedges
        </Text>

        {pitPending ? (
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
                  <MaterialCommunityIcons
                    name={opt.icon as keyof typeof MaterialCommunityIcons.glyphMap}
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
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Neo.ink,
    borderWidth: Neo.borderBold,
    borderColor: Neo.neonYellow,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 32,
    color: Neo.neonYellow,
    letterSpacing: 0.5,
  },
  rewardsLine: {
    fontSize: 20,
    color: Neo.textOnDark,
    textAlign: "center",
  },
  nextLine: {
    fontSize: 14,
    color: "rgba(250,250,250,0.55)",
    textAlign: "center",
    marginBottom: 4,
  },
  pitRow: {
    flexDirection: "row",
    width: "100%",
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
    borderColor: "rgba(34,211,238,0.4)",
  },
  pitChipPicked: {
    borderColor: Neo.neonYellow,
    backgroundColor: "rgba(253,224,71,0.14)",
  },
  pitChipDim: {
    opacity: 0.4,
  },
  pitLabel: {
    fontSize: 15,
    color: Neo.textOnDark,
  },
  pitValue: {
    fontSize: 13,
    color: "rgba(250,250,250,0.65)",
  },
  btn: {
    marginTop: 6,
    width: "100%",
    paddingVertical: 13,
    backgroundColor: Neo.neonCyan,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 10,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.38,
  },
  btnText: {
    fontSize: 19,
    color: Neo.ink,
  },
});
