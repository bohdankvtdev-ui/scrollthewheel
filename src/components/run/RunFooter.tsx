import { StyleSheet, Text, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { UpgradesBar } from "./UpgradesBar";

type RunFooterProps = {
  run: RunState;
};

export function RunFooter({ run }: RunFooterProps) {
  const perkN = run.perks.length;
  const relicN = run.relics.length;
  const debuffN = run.debuffs.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { fontFamily: FONT_BEBAS_NEUE }]}>Loadout</Text>
        <Text style={styles.counts}>
          {perkN} perks · {relicN} relics
          {debuffN > 0 ? ` · ${debuffN} curses` : ""}
        </Text>
      </View>
      <UpgradesBar run={run} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: RUN_LAYOUT.footerUpgrades,
    backgroundColor: Neo.surfaceDark,
    borderTopWidth: Neo.borderBold,
    borderTopColor: Neo.ink,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: Neo.neonCyan,
    letterSpacing: 0.5,
  },
  counts: {
    fontSize: 11,
    color: "rgba(250,250,250,0.65)",
    flexShrink: 1,
    textAlign: "right",
  },
});
