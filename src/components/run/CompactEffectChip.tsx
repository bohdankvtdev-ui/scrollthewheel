import { Pressable, StyleSheet } from "react-native";
import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";
import type { IconFamily } from "../../schemas";

type CompactEffectChipProps = {
  icon: string;
  iconFamily: IconFamily;
  accentBg: string;
  label: string;
  onPress?: () => void;
};

export function CompactEffectChip({
  icon,
  iconFamily,
  accentBg,
  label,
  onPress,
}: CompactEffectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <PrizeGlyph icon={icon} iconFamily={iconFamily} size="xs" tint={accentBg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88 },
});
