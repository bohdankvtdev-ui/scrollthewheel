import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { showRunInfoNotice, showTacticChosenNotice } from "../../game/notices/runNotices";
import type { RunState } from "../../schemas";
import {
  canUseMicroChoice,
  getMicroChoiceOffers,
  microChoiceChipCost,
  MICRO_CHOICE_META,
  type MicroChoiceId,
} from "../../game/tactics/microChoices";
import { WHEEL_COUNT } from "../../game/loop";
import { useRunStore } from "../../stores/runStore";

const BAR_H = RUN_LAYOUT.prizeFlash;
const ROW_H = 54;

const TACTIC_STYLE: Record<MicroChoiceId, string> = {
  reroll: "#FDBA74",
  insure: "#4ADE80",
  gamble: Neo.neonYellow,
};

type TacticPickBarProps = {
  run: RunState;
  onDismiss: () => void;
};

/** Single tactic offer in the 72px prize-flash bar. */
export function TacticPickBar({ run, onDismiss }: TacticPickBarProps) {
  const useMicroChoice = useRunStore((s) => s.useMicroChoice);
  const hasSnapshot = useRunStore((s) => s.preSpinSnapshot != null);

  const offers = useMemo(
    () =>
      getMicroChoiceOffers(run, run.wheelIndex, {
        hasPreSpinSnapshot: hasSnapshot,
      }),
    [hasSnapshot, run]
  );
  const offer = offers[0];

  const onPick = useCallback(
    (id: MicroChoiceId) => {
      const result = useMicroChoice(id);
      if (result.ok) {
        showTacticChosenNotice(id);
      } else {
        showRunInfoNotice(result.reason);
      }
    },
    [useMicroChoice]
  );

  if (offer == null) return null;

  return (
    <View style={styles.bar}>
      <TacticChip
        id={offer}
        run={run}
        offers={offers}
        hasSnapshot={hasSnapshot}
        onPress={() => onPick(offer)}
      />
      <Pressable
        onPress={onDismiss}
        hitSlop={6}
        style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
        accessibilityRole="button"
        accessibilityLabel="Skip tactic"
      >
        <Text style={[styles.skipText, { fontFamily: FONT_BEBAS_NEUE }]}>Skip</Text>
      </Pressable>
    </View>
  );
}

export const TacticPickPanel = TacticPickBar;

const TacticChip = memo(function TacticChip({
  id,
  run,
  offers,
  hasSnapshot,
  onPress,
}: {
  id: MicroChoiceId;
  run: RunState;
  offers: MicroChoiceId[];
  hasSnapshot: boolean;
  onPress: () => void;
}) {
  const meta = MICRO_CHOICE_META[id];
  const bg = TACTIC_STYLE[id];
  const cost = microChoiceChipCost(run, id);
  const used = (run.runEffects?.microChoiceWheelIndex ?? -1) === run.wheelIndex;
  const check = canUseMicroChoice(run, id, {
    hasPreSpinSnapshot: hasSnapshot,
    alreadyUsedThisWheel: used,
    isLastWheel: run.wheelIndex >= WHEEL_COUNT - 1,
    offers,
    gambleFlipActive: useRunStore.getState().ui.gambleFlipActive,
  });
  const disabled = !check.ok;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: disabled ? "#E8E4DC" : bg },
        pressed && !disabled && styles.chipPressed,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}. ${meta.pickerHint}. ${cost} chips`}
    >
      <View style={[styles.iconWrap, disabled && styles.iconWrapDisabled]}>
        <MaterialCommunityIcons
          name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color={disabled ? "rgba(10,10,10,0.28)" : Neo.ink}
        />
      </View>

      <Text style={[styles.chipHint, { fontFamily: FONT_BEBAS_NEUE }]}>{meta.pickerHint}</Text>

      <View style={styles.cost}>
        <MaterialCommunityIcons name="poker-chip" size={10} color={Neo.ink} />
        <Text style={[styles.costText, { fontFamily: FONT_BEBAS_NEUE }]}>{cost}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  bar: {
    height: BAR_H,
    width: "100%",
    maxWidth: RUN_LAYOUT.prizeFlashMaxWidth,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: ROW_H,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
  },
  chipPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconWrapDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  chipHint: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 14,
    color: Neo.ink,
    letterSpacing: 0.2,
  },
  cost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    flexShrink: 0,
  },
  costText: {
    fontSize: 11,
    color: Neo.ink,
  },
  skip: {
    width: 52,
    height: ROW_H,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: "rgba(255,255,255,0.45)",
    flexShrink: 0,
  },
  skipPressed: {
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  skipText: {
    fontSize: 14,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
});
