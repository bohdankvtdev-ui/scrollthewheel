import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import { VectorIcon } from "../../../lib/ui/VectorIcon";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { HomePalette } from "../../../theme/homeScreen";
import { Neo } from "../../../theme/neoBrutal";
import { PIT_STOP_OPTIONS, type PitStopOptionId } from "../../game/tactics/cyclePitStop";
import { ALPHA_CAMPAIGN_CYCLES } from "../../game/gdd";
import { getPermanentWedgeBonus, STARTING_WEDGE_COUNT } from "../../game/wheels/sliceCapacityBonus";
import { formatMoney } from "../../utils/formatMoney";
import type { RunState } from "../../schemas";
import type { RunUiEffect } from "../../stores/runStore";

const UI = {
  card: "#3B0764",
  body: "#FAFAFA",
  banner: HomePalette.yellow,
  bannerAlt: HomePalette.orange,
  money: HomePalette.greenBright,
  moneyBorder: HomePalette.green,
  chips: "#A5F3FC",
  chipsBorder: HomePalette.cyan,
  boss: HomePalette.purpleBright,
  next: HomePalette.purpleBright,
} as const;

const PIT_STYLE: Record<
  PitStopOptionId,
  { bg: string; border: string; picked: string }
> = {
  pit_laser: { bg: HomePalette.purpleBright, border: HomePalette.purple, picked: Neo.neonYellow },
  pit_cash: { bg: HomePalette.greenBright, border: HomePalette.green, picked: Neo.neonYellow },
  pit_chips: { bg: "#BAE6FD", border: HomePalette.cyan, picked: Neo.neonYellow },
};

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

  const headline = alphaChoice
    ? `${ALPHA_CAMPAIGN_CYCLES} cycles cleared`
    : rewardReady
      ? `Cycle ${reward.cycle} cleared!`
      : "Cycle cleared";

  return (
    <View style={styles.slot} accessibilityViewIsModal>
      <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
        <View style={styles.banner}>
          <View style={styles.confettiRow} pointerEvents="none">
            {[HomePalette.cyan, HomePalette.magenta, HomePalette.green, HomePalette.pink].map(
              (c, i) => (
                <View key={c} style={[styles.confettiDot, { backgroundColor: c, marginLeft: i ? 6 : 0 }]} />
              )
            )}
          </View>
          <View style={styles.bannerIcon}>
            <MaterialIcons name="emoji-events" size={28} color={Neo.ink} />
          </View>
          <Text style={[styles.bannerKicker, { fontFamily: FONT_BEBAS_NEUE }]}>Rewards unlocked</Text>
          <Text style={[styles.bannerHeadline, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={2}>
            {headline}
          </Text>
        </View>

        <View style={styles.body}>
          {bossSliceEffect != null ? (
            <View style={styles.bossBox}>
              <Text style={[styles.sectionLabel, { fontFamily: FONT_BEBAS_NEUE, color: Neo.ink }]}>
                Boss wheel
              </Text>
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
            </View>
          ) : null}

          {rewardReady ? (
            <View style={styles.rewardGrid}>
              <Animated.View
                entering={FadeInDown.delay(80).springify().damping(16)}
                style={[styles.rewardTile, styles.moneyTile]}
              >
                <View style={styles.rewardIconWrap}>
                  <MaterialIcons name="attach-money" size={26} color={Neo.ink} />
                </View>
                <Text style={[styles.rewardAmt, { fontFamily: FONT_BEBAS_NEUE }]}>+${reward!.money}</Text>
                <Text style={[styles.rewardKind, { fontFamily: FONT_BEBAS_NEUE }]}>Bank</Text>
              </Animated.View>
              <Animated.View
                entering={FadeInDown.delay(160).springify().damping(16)}
                style={[styles.rewardTile, styles.chipTile]}
              >
                <View style={styles.rewardIconWrap}>
                  <MaterialCommunityIcons name="poker-chip" size={26} color={Neo.ink} />
                </View>
                <Text style={[styles.rewardAmt, { fontFamily: FONT_BEBAS_NEUE }]}>+{reward!.chips}</Text>
                <Text style={[styles.rewardKind, { fontFamily: FONT_BEBAS_NEUE }]}>Shop chips</Text>
              </Animated.View>
            </View>
          ) : (
            <Text style={[styles.preparing, { fontFamily: FONT_BEBAS_NEUE }]}>Preparing cycle rewards…</Text>
          )}

          {needsPit ? (
            <>
              <View style={styles.pitHeader}>
                <Text style={[styles.sectionLabel, { fontFamily: FONT_BEBAS_NEUE, color: Neo.ink }]}>
                  Pit stop
                </Text>
                <Text style={styles.pitHint}>Pick one bonus</Text>
              </View>
              <View style={styles.pitRow}>
                {PIT_STOP_OPTIONS.map((opt, idx) => {
                  const isPicked = pickedPitId === opt.id;
                  const dim = pickedPitId != null && !isPicked;
                  const pit = PIT_STYLE[opt.id];
                  return (
                    <Animated.View
                      key={opt.id}
                      entering={FadeInDown.delay(220 + idx * 60).springify().damping(16)}
                      style={styles.pitCell}
                    >
                      <Pressable
                        style={[
                          styles.pitChip,
                          { backgroundColor: pit.bg, borderColor: pit.border },
                          isPicked && { borderColor: pit.picked, backgroundColor: HomePalette.yellow },
                          dim && styles.pitChipDim,
                        ]}
                        onPress={() => setPickedPitId(opt.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`${opt.title} ${opt.line}`}
                        accessibilityState={{ selected: isPicked }}
                      >
                        <VectorIcon
                          name={opt.icon}
                          family={opt.iconFamily}
                          size={22}
                          color={Neo.ink}
                        />
                        <Text style={[styles.pitLabel, { fontFamily: FONT_BEBAS_NEUE }]}>
                          {opt.title}
                        </Text>
                        <Text style={[styles.pitValue, { fontFamily: FONT_BEBAS_NEUE }]}>
                          {opt.line}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={styles.nextBadge}>
            <Text style={[styles.nextLine, { fontFamily: FONT_BEBAS_NEUE }]}>
              {alphaChoice
                ? `Bank ${formatMoney(run.money)}`
                : `Next · Cycle ${nextCycle} · Wheel 1 · ${nextSlices} wedges`}
            </Text>
          </View>

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
        </View>
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
    maxWidth: 380,
    backgroundColor: UI.body,
    borderRadius: 18,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    overflow: "hidden",
    shadowColor: Neo.ink,
    shadowOffset: Neo.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  banner: {
    backgroundColor: UI.banner,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 4,
  },
  confettiRow: {
    position: "absolute",
    top: 10,
    right: 14,
    flexDirection: "row",
  },
  confettiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Neo.ink,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: UI.bannerAlt,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bannerKicker: {
    fontSize: 13,
    color: Neo.inkMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  bannerHeadline: {
    fontSize: 32,
    color: Neo.ink,
    letterSpacing: 0.4,
    textAlign: "center",
    lineHeight: 34,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  bossBox: {
    backgroundColor: UI.boss,
    borderRadius: 12,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    padding: 12,
  },
  spinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  spinTextCol: { flex: 1, minWidth: 0, gap: 2 },
  spinLabel: {
    fontSize: 24,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
  spinHint: {
    fontSize: 13,
    color: Neo.inkMuted,
  },
  rewardGrid: {
    flexDirection: "row",
    gap: 10,
  },
  rewardTile: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  moneyTile: {
    backgroundColor: UI.money,
    borderColor: UI.moneyBorder,
  },
  chipTile: {
    backgroundColor: UI.chips,
    borderColor: UI.chipsBorder,
  },
  rewardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardAmt: {
    fontSize: 26,
    color: Neo.ink,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  rewardKind: {
    fontSize: 12,
    color: Neo.inkMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  preparing: {
    fontSize: 16,
    color: HomePalette.cyan,
    textAlign: "center",
    paddingVertical: 8,
  },
  pitHeader: {
    gap: 2,
  },
  pitHint: {
    fontSize: 13,
    color: Neo.inkMuted,
  },
  pitRow: {
    flexDirection: "row",
    gap: 8,
  },
  pitCell: {
    flex: 1,
  },
  pitChip: {
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: Neo.borderThin,
  },
  pitChipDim: {
    opacity: 0.42,
  },
  pitLabel: {
    fontSize: 11,
    color: Neo.ink,
    textAlign: "center",
  },
  pitValue: {
    fontSize: 10,
    color: Neo.inkMuted,
    textAlign: "center",
  },
  nextBadge: {
    backgroundColor: UI.next,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nextLine: {
    fontSize: 14,
    color: Neo.ink,
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.25,
  },
  choiceRow: {
    gap: 8,
  },
  btn: {
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    shadowColor: Neo.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnPrimary: {
    backgroundColor: HomePalette.cyan,
  },
  btnGhost: {
    backgroundColor: HomePalette.pink,
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
    color: Neo.ink,
    letterSpacing: 0.3,
  },
});
