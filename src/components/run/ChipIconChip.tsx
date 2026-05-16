import { Pressable, StyleSheet } from "react-native";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import type { IconFamily } from "../../schemas";

const SLOT = 40;

type ChipIconChipProps = {
  icon: string;
  iconFamily: IconFamily;
  onPress: () => void;
};

export function ChipIconChip({ icon, iconFamily, onPress }: ChipIconChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View casino chip"
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <PrizeGlyph icon={icon} iconFamily={iconFamily} size="xs" tint="#BAE6FD" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: SLOT,
    height: SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
