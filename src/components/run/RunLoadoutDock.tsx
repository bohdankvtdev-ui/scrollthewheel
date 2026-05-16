import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { CARD_CATALOG } from "../../data/cards";
import { PERK_CATALOG } from "../../data/perks";
import { DEBUFF_CATALOG } from "../../data/debuffs";
import { RELIC_CATALOG } from "../../data/relics";
import type { RunState } from "../../schemas";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo, neoSubtitleOnDark } from "../../../theme/neoBrutal";
import { PerkIconChip } from "./PerkIconChip";
import { PerkDetailSheet } from "./PerkDetailSheet";
import { ChipIconChip } from "./ChipIconChip";
import { ChipDetailSheet } from "./ChipDetailSheet";
import { CompactEffectChip } from "./CompactEffectChip";

type RunLoadoutDockProps = {
  run: RunState;
  highlightPerkId?: string | null;
};

/** Fixed-height loadout rail — always mounted so the wheel never jumps when the first perk lands. */
export function RunLoadoutDock({ run, highlightPerkId }: RunLoadoutDockProps) {
  const [perkDetailId, setPerkDetailId] = useState<string | null>(null);
  const [chipDetailId, setChipDetailId] = useState<string | null>(null);

  const hasItems =
    run.perks.length > 0 ||
    run.deck.length > 0 ||
    run.debuffs.length > 0 ||
    run.relics.length > 0;

  return (
    <View style={styles.wrap}>
      {!hasItems ? (
        <View style={styles.emptyRail}>
          <Text style={[neoSubtitleOnDark(11), styles.emptyLabel, { fontFamily: FONT_BEBAS_NEUE }]}>
            Loadout
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {run.perks.map((id) => {
            const p = PERK_CATALOG[id];
            if (p == null) return null;
            return (
              <PerkIconChip
                key={`perk-${id}`}
                icon={p.icon}
                iconFamily={p.iconFamily}
                tier={p.tier}
                highlighted={id === highlightPerkId}
                animateEnter={id === highlightPerkId}
                onPress={() => setPerkDetailId(id)}
              />
            );
          })}
          {run.deck.map((id) => {
            const c = CARD_CATALOG[id];
            if (c == null) return null;
            return (
              <ChipIconChip
                key={`chip-${id}`}
                icon={c.icon}
                iconFamily={c.iconFamily}
                onPress={() => setChipDetailId(id)}
              />
            );
          })}
          {run.debuffs.map((id) => {
            const d = DEBUFF_CATALOG[id];
            if (d == null) return null;
            return (
              <CompactEffectChip
                key={`debuff-${id}`}
                icon={d.icon}
                iconFamily={d.iconFamily}
                accentBg="#FEE2E2"
                label={d.name}
                onPress={() => {}}
              />
            );
          })}
          {run.relics.map((id) => {
            const r = RELIC_CATALOG[id];
            if (r == null) return null;
            return (
              <CompactEffectChip
                key={`relic-${id}`}
                icon={r.icon}
                iconFamily={r.iconFamily}
                accentBg="#EDE9FE"
                label={r.name}
                onPress={() => {}}
              />
            );
          })}
        </ScrollView>
      )}

      <PerkDetailSheet
        perkId={perkDetailId}
        visible={perkDetailId != null}
        onClose={() => setPerkDetailId(null)}
      />
      <ChipDetailSheet
        chipId={chipDetailId}
        visible={chipDetailId != null}
        onClose={() => setChipDetailId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.loadout,
    justifyContent: "center",
    borderBottomWidth: Neo.borderThin,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  emptyRail: {
    height: RUN_LAYOUT.loadout - 8,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  emptyLabel: {
    opacity: 0.35,
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingRight: 18,
    minHeight: RUN_LAYOUT.loadout - 8,
  },
});
