import { ScrollView, StyleSheet, View } from "react-native";
import type { RunState } from "../../schemas";
import { selectUpgradeChips } from "../../stores/selectors";
import { EffectIcon } from "./EffectIcon";
import { UpgradeChip } from "./UpgradeChip";

type UpgradesBarProps = {
  run: RunState;
};

export function UpgradesBar({ run }: UpgradesBarProps) {
  const chips = selectUpgradeChips(run);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {chips.length === 0 ? (
          <EffectIcon
            icon="casino"
            iconFamily="MaterialIcons"
            effectHint="Spin"
            size="sm"
            accentBg="rgba(255,255,255,0.1)"
            borderColor="rgba(250,250,250,0.3)"
          />
        ) : (
          chips.map((c, i) => <UpgradeChip key={`${c.kind}-${c.id}-${i}`} kind={c.kind} id={c.id} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
  },
});
