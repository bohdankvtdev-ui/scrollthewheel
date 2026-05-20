import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import { VectorIcon } from "../../../lib/ui/VectorIcon";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PIT_STOP_OPTIONS, type PitStopOptionId } from "../../game/tactics/cyclePitStop";
import { ALPHA_CAMPAIGN_CYCLES } from "../../game/gdd";
import { getPermanentWedgeBonus, STARTING_WEDGE_COUNT } from "../../game/wheels/sliceCapacityBonus";
import { formatMoney } from "../../utils/formatMoney";
import type { RunState } from "../../schemas";
import type { RunUiEffect } from "../../stores/runStore";
import { useRunStore } from "../../stores/runStore";

type BossCycleRewardPanelProps = {
  run: RunState;
  bossSliceEffect: RunUiEffect | null;
  onContinue: (pitId?: PitStopOptionId) => void;
  onContinueInfinite: () => void;
  onEndCampaign: () => void;
};

/** Single wheel-slot card: boss result + cycle $/chips + pit pick + one Continue. */
export function BossCycleRewardPanel({
  run,
  bossSliceEffect,
  onContinue,
  onContinueInfinite,
  onEndCampaign,
}: BossCycleRewardPanelProps) {
  const pitPending = run.runEffects?.pitStopPending === true;
  const alphaChoice = run.runEffects?.alphaMilestonePending === true;
  const reward = run.lastCycleReward;
  const [pickedPitId, setPickedPitId] = useState<PitStopOptionId | null>(null);
  const continuingRef = useRef(false);

  useEffect(() => {
    setPickedPitId(null);
    continuingRef.current = false;
  }, [pitPending, reward?.cycle, alphaChoice]);

  const needsPit = pitPending && !alphaChoice;
  const canContinue = !needsPit || pickedPitId != null;
  const rewardReady = reward != null;
  const canContinueNow = rewardReady && canContinue;
  const nextCycle = run.floor + 1;
  const nextSlices = STARTING_WEDGE_COUNT + getPermanentWedgeBonus(run);

  const handleContinue = useCallback(() => {
    if (!canContinueNow || continuingRef.current) return;
    continuingRef.current = true;
    onContinue(pickedPitId ?? undefined);
  }, [canContinueNow, onContinue, pickedPitId]);

  return (
    <View style={styles.slot} accessibilityViewIsModal>
      <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
        {bossSliceEffect != null ? (
          <>
            <Text style={[styles.sectionLabel, { fontFamily: FONT_BEBAS_NEUE }]}>Boss wheel</Text>
            <View style={styles.spinRow}>
              <PrizeGlyph
                icon={bossSliceEffect.icon}
                iconFamily={bossSliceEffect.iconFamily}
                size="md"
                tint={bossSliceEffect.accent}
                iconColor={bossSliceEffect.iconColor}
                tone={bossSliceEffect.tone}
              />
              <View style={styles.spinTextCol}>
                <Text style={[styles.spinLabel, { fontFamily: FONT_BEBAS_NEUE }]}>
                  {bossSliceEffect.shortLabel}
                </Text>
                {bossSliceEffect.effectHint ? (
                  <Text style={styles.spinHint} numberOfLines={1}>
                    {bossSliceEffect.effectHint}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        {rewardReady ? (
          <>
            <Text style={[styles.sectionLabel, { fontFamily: FONT_BEBAS_NEUE }]}>
              Cycle cleared
            </Text>
            <Text style={[styles.headline, { fontFamily: FONT_BEBAS_NEUE }]}>
              {alphaChoice
                ? `${ALPHA_CAMPAIGN_CYCLES} cycles cleared`
                : `Cycle ${reward!.cycle}`}
            </Text>

            <View style={styles.rewardRow}>
              <MaterialIcons name="attach-money" size={24} color={Neo.neonYellow} />
              <Text style={[styles.rewardVal, { fontFamily: FONT_BEBAS_NEUE }]}>
                +${reward!.money} bank
              </Text>
            </View>
            <View style={styles.rewardRow}>
              <MaterialCommunityIcons name="poker-chip" size={24} color={Neo.neonCyan} />
              <Text style={[styles.rewardVal, { fontFamily: FONT_BEBAS_NEUE }]}>
                +{reward!.chips} shop chips
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.preparing, { fontFamily: FONT_BEBAS_NEUE }]}>
            Preparing cycle rewards…
          </Text>
        )}

        {needsPit ? (
          <>
            <View style={styles.divider} />
            <Text style={[styles.sectionLabel, { fontFamily: FONT_BEBAS_NEUE }]}>Pit stop</Text>
            <Text style={styles.pitHint}>Pick one bonus — applied when you continue</Text>
            <View style={styles.pitRow}>
              {PIT_STOP_OPTIONS.map((opt) => {
                const isPicked = pickedPitId === opt.id;
                const dim = pickedPitId != null && !isPicked;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.pitChip, isPicked && styles.pitChipPicked, dim && styles.pitChipDim]}
                    onPress={() => setPickedPitId(opt.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${opt.title} ${opt.line}`}
                    accessibilityState={{ selected: isPicked }}
                  >
                    <VectorIcon
                      name={opt.icon}
                      family={opt.iconFamily}
                      size={22}
                      color={isPicked ? Neo.neonYellow : Neo.neonCyan}
                    />
                    <Text style={[styles.pitLabel, { fontFamily: FONT_BEBAS_NEUE }]}>
                      {opt.title}
                    </Text>
                    <Text style={[styles.pitValue, { fontFamily: FONT_BEBAS_NEUE }]}>
                      {opt.line}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={[styles.nextLine, { fontFamily: FONT_BEBAS_NEUE }]}>
          {alphaChoice
            ? `Bank ${formatMoney(run.money)}`
            : `Next · Cycle ${nextCycle} · Wheel 1 · ${nextSlices} wedges`}
        </Text>

        {alphaChoice ? (
          <View style={styles.choiceRow}>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={onContinueInfinite}
              accessibilityRole="button"
              accessibilityLabel="Continue infinite run"
            >
              <Text style={[styles.btnText, { fontFamily: FONT_BEBAS_NEUE }]}>Keep playing</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={onEndCampaign}
              accessibilityRole="button"
              accessibilityLabel="End run"
            >
              <Text style={[styles.btnTextGhost, { fontFamily: FONT_BEBAS_NEUE }]}>End run</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.btn, styles.btnPrimary, !canContinueNow && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinueNow}
            accessibilityRole="button"
            accessibilityLabel={
              needsPit && pickedPitId == null
                ? "Pick a pit stop bonus first"
                : "Continue to next cycle"
            }
            accessibilityState={{ disabled: !canContinueNow }}
          >
            <Text style={[styles.btnText, { fontFamily: FONT_BEBAS_NEUE }]}>
              {!rewardReady
                ? "…"
                : needsPit && pickedPitId == null
                  ? "Pick pit bonus"
                  : "Continue"}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1A1228",
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    padding: 18,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    color: "rgba(250,250,250,0.5)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  spinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  spinTextCol: { flex: 1, minWidth: 0, gap: 2 },
  spinLabel: {
    fontSize: 26,
    color: Neo.textOnDark,
    letterSpacing: 0.35,
  },
  spinHint: {
    fontSize: 14,
    color: "rgba(250,250,250,0.55)",
  },
  divider: {
    height: Neo.borderThin,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 2,
  },
  headline: {
    fontSize: 30,
    color: Neo.neonYellow,
    letterSpacing: 0.4,
  },
  preparing: {
    fontSize: 16,
    color: Neo.neonCyan,
    textAlign: "center",
    paddingVertical: 6,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
  },
  rewardVal: {
    fontSize: 20,
    color: Neo.textOnDark,
  },
  pitHint: {
    fontSize: 14,
    color: "rgba(250,250,250,0.55)",
    marginBottom: 2,
  },
  pitRow: {
    flexDirection: "row",
    gap: 8,
  },
  pitChip: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    fontSize: 12,
    color: Neo.textOnDark,
    textAlign: "center",
  },
  pitValue: {
    fontSize: 11,
    color: Neo.neonCyan,
    textAlign: "center",
  },
  nextLine: {
    fontSize: 15,
    color: "rgba(250,250,250,0.72)",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 2,
  },
  choiceRow: {
    gap: 8,
    marginTop: 4,
  },
  btn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: Neo.neonCyan,
  },
  btnGhost: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontSize: 20,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
  btnTextGhost: {
    fontSize: 20,
    color: Neo.textOnDark,
    letterSpacing: 0.3,
  },
});
