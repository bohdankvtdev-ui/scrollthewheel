import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import type { SliceIconPlacement } from "./SliceIconLayer";

type SliceTouchLayerProps = {
  size: number;
  placements: SliceIconPlacement[];
  sliceCount: number;
  enabled?: boolean;
  onSlicePress?: (index: number) => void;
};

/** Transparent tap targets over each wedge (rotates with the disc). */
export function SliceTouchLayer({
  size,
  placements,
  sliceCount,
  enabled = true,
  onSlicePress,
}: SliceTouchLayerProps) {
  if (onSlicePress == null) return null;

  const hitR = Math.round(Math.min(56, Math.max(40, size * 0.14)));

  return (
    <View style={[styles.layer, { width: size, height: size }]} pointerEvents="box-none">
      {placements.map((pt, index) => {
        if (index >= sliceCount) return null;
        return (
          <Pressable
            key={`slice-touch-${index}`}
            style={[
              styles.hit,
              {
                width: hitR * 2,
                height: hitR * 2,
                borderRadius: hitR,
                left: pt.x - hitR,
                top: pt.y - hitR,
              },
            ]}
            disabled={!enabled}
            onPress={() => {
              if (!enabled) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSlicePress(index);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Preview prize on slice ${index + 1}`}
            accessibilityHint="Shows what happens if this slice wins"
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 12,
  },
  hit: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});
