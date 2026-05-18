import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRunStore } from "../../stores/runStore";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { PERK_CATALOG } from "../../data/perks";
import { DEBUFF_CATALOG } from "../../data/debuffs";
import type { RunState } from "../../schemas";
import { PerkIconChip } from "./PerkIconChip";
import { PerkDetailSheet } from "./PerkDetailSheet";
import { DebuffDetailSheet } from "./DebuffDetailSheet";
import { getLoadoutPerkIds } from "../../game/shields/shieldRules";

type RunLoadoutDockProps = {
  run: RunState;
  highlightPerkId?: string | null;
  highlightDebuffId?: string | null;
};

const HIGHLIGHT_MS = 1600;

/** Perks (green) and curses (red) under the header — fixed height to avoid layout shift. */
export function RunLoadoutDock({
  run,
  highlightPerkId,
  highlightDebuffId,
}: RunLoadoutDockProps) {
  const [perkDetailId, setPerkDetailId] = useState<string | null>(null);
  const [debuffDetailId, setDebuffDetailId] = useState<string | null>(null);
  const clearLastWonPerk = useRunStore((s) => s.clearLastWonPerk);
  const clearLastWonDebuff = useRunStore((s) => s.clearLastWonDebuff);

  const loadoutPerks = getLoadoutPerkIds(run);
  const debuffs = run.debuffs;
  const hasItems = loadoutPerks.length > 0 || debuffs.length > 0;

  useEffect(() => {
    if (highlightPerkId == null && highlightDebuffId == null) return;
    const t = setTimeout(() => {
      clearLastWonPerk();
      clearLastWonDebuff();
    }, HIGHLIGHT_MS);
    return () => clearTimeout(t);
  }, [highlightPerkId, highlightDebuffId, clearLastWonPerk, clearLastWonDebuff]);

  return (
    <View style={styles.wrap} pointerEvents={hasItems ? "auto" : "none"}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        scrollEnabled={hasItems}
      >
        {loadoutPerks.map((id) => {
          const p = PERK_CATALOG[id];
          if (p == null) return null;
          return (
            <PerkIconChip
              key={`perk-${id}`}
              icon={p.icon}
              iconFamily={p.iconFamily}
              variant="good"
              tier={p.tier}
              highlighted={id === highlightPerkId}
              animateEnter={id === highlightPerkId}
              onPress={() => setPerkDetailId(id)}
              accessibilityLabel={`Perk: ${p.name}`}
            />
          );
        })}
        {debuffs.map((id) => {
          const d = DEBUFF_CATALOG[id];
          if (d == null) return null;
          return (
            <PerkIconChip
              key={`debuff-${id}`}
              icon={d.icon}
              iconFamily={d.iconFamily}
              variant="bad"
              highlighted={id === highlightDebuffId}
              animateEnter={id === highlightDebuffId}
              onPress={() => setDebuffDetailId(id)}
              accessibilityLabel={`Curse: ${d.name}`}
            />
          );
        })}
      </ScrollView>

      <PerkDetailSheet
        perkId={perkDetailId}
        visible={perkDetailId != null}
        onClose={() => setPerkDetailId(null)}
      />
      <DebuffDetailSheet
        debuffId={debuffDetailId}
        visible={debuffDetailId != null}
        onClose={() => setDebuffDetailId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.loadout,
    justifyContent: "center",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingRight: 18,
    height: RUN_LAYOUT.loadout,
  },
});
