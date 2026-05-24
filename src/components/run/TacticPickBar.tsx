import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
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

type TacticPickBarProps = {
  run: RunState;
  onDismiss: () => void;
};

/** Single tactic offer in the prize-flash bar. */
export function TacticPickBar({ run, onDismiss }: TacticPickBarProps) {
  const chrome = useRunChromeMetrics();
  const rowH = Math.round(54 * chrome.scale);
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
    <View
      style={[
        styles.bar,
        {
          height: chrome.layout.prizeFlash,
          maxWidth: chrome.layout.prizeFlashMaxWidth,
          paddingHorizontal: chrome.bar.padH,
        },
      ]}
    >
      <TacticChip
        id={offer}
        run={run}
        offers={offers}
        hasSnapshot={hasSnapshot}
        rowH={rowH}
        scale={chrome.scale}
        onPress={() => onPick(offer)}
      />
      <Pressable
        onPress={onDismiss}
        hitSlop={6}
        style={({ pressed }) => [styles.skip, { width: Math.round(58 * chrome.scale), height: rowH }, pressed && styles.skipPressed]}
        accessibilityRole="button"
        accessibilityLabel="Skip tactic and continue"
      >
        <MaterialCommunityIcons name="check-bold" size={Math.round(18 * chrome.scale)} color={Neo.ink} />
        <Text
          style={[
            styles.skipText,
            { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(14 * chrome.scale) },
          ]}
        >
          Skip
        </Text>
      </Pressable>
    </View>
  );
}

const TACTIC_STYLE: Record<MicroChoiceId, string> = {
  reroll: "#FDBA74",
  insure: "#4ADE80",
  gamble: "#DC2626",
};

export const TacticPickPanel = TacticPickBar;

const TacticChip = memo(function TacticChip({
  id,
  run,
  offers,
  hasSnapshot,
  rowH,
  scale,
  onPress,
}: {
  id: MicroChoiceId;
  run: RunState;
  offers: MicroChoiceId[];
  hasSnapshot: boolean;
  rowH: number;
  scale: number;
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
  const iconWrap = Math.round(34 * scale);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        { minHeight: rowH, backgroundColor: disabled ? "#E8E4DC" : bg },
        pressed && !disabled && styles.chipPressed,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}. ${meta.pickerHint}. ${cost} chips`}
    >
      <View
        style={[
          styles.iconWrap,
          { width: iconWrap, height: iconWrap, borderRadius: Math.round(9 * scale) },
          disabled && styles.iconWrapDisabled,
        ]}
      >
        <MaterialCommunityIcons
          name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={Math.round(22 * scale)}
          color={disabled ? "rgba(10,10,10,0.28)" : Neo.ink}
        />
      </View>

      <Text
        style={[
          styles.chipHint,
          { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(12 * scale), lineHeight: Math.round(14 * scale) },
        ]}
      >
        {meta.pickerHint}
      </Text>

      <View style={styles.cost}>
        <MaterialCommunityIcons name="poker-chip" size={Math.round(10 * scale)} color={Neo.ink} />
        <Text
          style={[
            styles.costText,
            { fontFamily: FONT_BEBAS_NEUE, fontSize: Math.round(11 * scale) },
          ]}
        >
          {cost}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    flex: 1,
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
    color: Neo.ink,
  },
  skip: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 11,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: "#4ADE80",
    flexShrink: 0,
  },
  skipPressed: {
    backgroundColor: "#22C55E",
    opacity: 0.92,
  },
  skipText: {
    color: Neo.ink,
    letterSpacing: 0.35,
  },
});
