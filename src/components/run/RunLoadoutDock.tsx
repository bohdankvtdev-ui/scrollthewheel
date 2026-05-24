import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Neo } from "../../../theme/neoBrutal";
import { useRunStore } from "../../stores/runStore";
import { useRunChromeMetrics } from "../../../lib/layout/runChrome";
import { PERK_CATALOG } from "../../data/perks";
import { PERK_FAMILY_COLORS } from "../../game/perks/perkFamilies";
import { resolveEntityIcon } from "../../game/content/resolveIcon";
import { DEBUFF_CATALOG } from "../../data/debuffs";
import type { RunState } from "../../schemas";
import { PerkIconChip } from "./PerkIconChip";
import { ShieldLoadoutChip } from "./ShieldLoadoutChip";
import { PerkDetailSheet } from "./PerkDetailSheet";
import { DebuffDetailSheet } from "./DebuffDetailSheet";
import { getLoadoutStacks } from "../../game/perks/perkStacks";

type RunLoadoutDockProps = {
  run: RunState;
  highlightPerkId?: string | null;
  highlightDebuffId?: string | null;
};

const HIGHLIGHT_MS = 1600;

/** Oldest left → newest right (new perks slide in from the right). */
export function RunLoadoutDock({
  run,
  highlightPerkId,
  highlightDebuffId,
}: RunLoadoutDockProps) {
  const chrome = useRunChromeMetrics();
  const chipSize = chrome.layout.chipSlot;
  const loadoutHeight = chrome.layout.loadout;
  const [perkDetailId, setPerkDetailId] = useState<string | null>(null);
  const [debuffDetailId, setDebuffDetailId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const clearLastWonPerk = useRunStore((s) => s.clearLastWonPerk);
  const clearLastWonDebuff = useRunStore((s) => s.clearLastWonDebuff);

  const stacks = getLoadoutStacks(run);
  const hasItems = stacks.length > 0;

  useEffect(() => {
    if (highlightPerkId == null && highlightDebuffId == null) return;
    const t = setTimeout(() => {
      clearLastWonPerk();
      clearLastWonDebuff();
    }, HIGHLIGHT_MS);
    return () => clearTimeout(t);
  }, [highlightPerkId, highlightDebuffId, clearLastWonPerk, clearLastWonDebuff]);

  useEffect(() => {
    if (highlightPerkId != null || highlightDebuffId != null) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [highlightPerkId, highlightDebuffId, stacks.length]);

  return (
    <View
      style={[styles.wrap, { height: loadoutHeight }]}
      pointerEvents={hasItems ? "auto" : "none"}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { height: loadoutHeight }]}
        scrollEnabled={hasItems}
      >
        {stacks.map((stack) => {
          if (stack.kind === "shield") {
            return <ShieldLoadoutChip key="__shields__" count={stack.count} size={chipSize} />;
          }
          if (stack.kind === "perk") {
            const p = PERK_CATALOG[stack.id];
            if (p == null) return null;
            const resolved = resolveEntityIcon("perk", stack.id);
            const familyColors = PERK_FAMILY_COLORS[p.family];
            return (
              <PerkIconChip
                key={`perk-${stack.id}`}
                size={chipSize}
                icon={resolved.icon}
                iconFamily={resolved.iconFamily}
                variant="good"
                familyTint={familyColors.bg}
                familyIconColor={familyColors.accent}
                familyHighlight={familyColors.border}
                tier={p.tier}
                stackCount={stack.count}
                highlighted={stack.id === highlightPerkId}
                animateEnter={stack.id === highlightPerkId}
                onPress={() => setPerkDetailId(stack.id)}
                accessibilityLabel={`Perk: ${p.name}${stack.count > 1 ? ` ×${stack.count}` : ""}`}
              />
            );
          }
          const d = DEBUFF_CATALOG[stack.id];
          if (d == null) return null;
          return (
            <PerkIconChip
              key={`debuff-${stack.id}`}
              size={chipSize}
              icon={d.icon}
              iconFamily={d.iconFamily}
              variant="bad"
              stackCount={stack.count}
              highlighted={stack.id === highlightDebuffId}
              animateEnter={stack.id === highlightDebuffId}
              onPress={() => setDebuffDetailId(stack.id)}
              accessibilityLabel={`Curse: ${d.name}${stack.count > 1 ? ` ×${stack.count}` : ""}`}
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
    justifyContent: "center",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingRight: 18,
  },
});
