import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import {
  bailoutChipCost,
  canUseDesperation,
  DESPERATION_META,
  type DesperationId,
} from "../../game/tactics/desperationTactics";
import { microChoiceChipCost } from "../../game/tactics/microChoices";
import { showRunInfoNotice, showRunNotice } from "../../game/notices/runNotices";
import type { RunState } from "../../schemas";
import { useRunStore } from "../../stores/runStore";

const TACTIC_STYLE: Record<DesperationId, string> = {
  reroll: "#FDBA74",
  bailout: "#4ADE80",
};

type DesperationPickBarProps = {
  run: RunState;
  offers: DesperationId[];
  onGiveUp: () => void;
};

export function DesperationPickBar({ run, offers, onGiveUp }: DesperationPickBarProps) {
  const useDesperationChoice = useRunStore((s) => s.useDesperationChoice);
  const hasSnapshot = useRunStore((s) => s.preSpinSnapshot != null);
  const offer = offers[0];

  const onPick = useCallback(
    (id: DesperationId) => {
      const result = useDesperationChoice(id);
      if (result.ok) {
        const meta = DESPERATION_META[id];
        showRunNotice({
          type: "success",
          title: meta.label,
          body: meta.chosen,
          icon: meta.icon,
        });
      } else {
        showRunInfoNotice(result.reason);
      }
    },
    [useDesperationChoice]
  );

  if (offer == null) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { fontFamily: FONT_BEBAS_NEUE }]}>Last chance</Text>
        <Text style={styles.sub}>Spend chips to stay in the run — or give up</Text>
      </View>
      <View style={styles.row}>
        <DesperationChip
          id={offer}
          run={run}
          offers={offers}
          hasSnapshot={hasSnapshot}
          onPress={() => onPick(offer)}
        />
        <Pressable
          onPress={onGiveUp}
          style={({ pressed }) => [styles.giveUp, pressed && styles.giveUpPressed]}
          accessibilityRole="button"
          accessibilityLabel="End run"
        >
          <Text style={[styles.giveUpText, { fontFamily: FONT_BEBAS_NEUE }]}>Give up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const DesperationChip = memo(function DesperationChip({
  id,
  run,
  offers,
  hasSnapshot,
  onPress,
}: {
  id: DesperationId;
  run: RunState;
  offers: DesperationId[];
  hasSnapshot: boolean;
  onPress: () => void;
}) {
  const meta = DESPERATION_META[id];
  const cost = useMemo(
    () => (id === "reroll" ? microChoiceChipCost(run, "reroll") : bailoutChipCost(run)),
    [id, run]
  );
  const check = canUseDesperation(run, id, { hasPreSpinSnapshot: hasSnapshot, offers });
  const disabled = !check.ok;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: disabled ? "#E8E4DC" : TACTIC_STYLE[id] },
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
  wrap: {
    height: RUN_LAYOUT.prizeFlash,
    width: "100%",
    backgroundColor: "#1a1028",
    borderTopWidth: Neo.borderBold,
    borderTopColor: Neo.neonYellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  header: {
    gap: 2,
  },
  kicker: {
    fontSize: 18,
    color: Neo.neonYellow,
    letterSpacing: 0.6,
  },
  sub: {
    fontSize: 12,
    color: "rgba(250,250,250,0.55)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  chip: {
    flex: 1,
    minHeight: 54,
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
    opacity: 0.92,
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
  },
  iconWrapDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  chipHint: {
    flex: 1,
    fontSize: 12,
    lineHeight: 14,
    color: Neo.ink,
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
  },
  costText: {
    fontSize: 11,
    color: Neo.ink,
  },
  giveUp: {
    width: 72,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: "rgba(255,92,92,0.35)",
  },
  giveUpPressed: {
    opacity: 0.88,
  },
  giveUpText: {
    fontSize: 14,
    color: "#FECACA",
    letterSpacing: 0.35,
  },
});
