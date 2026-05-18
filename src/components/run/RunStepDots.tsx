import { StyleSheet, View } from "react-native";
import { WHEEL_COUNT } from "../../game/loop";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import { Neo } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";

type RunStepDotsProps = {
  run: RunState;
};

export function RunStepDots({ run }: RunStepDotsProps) {
  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: WHEEL_COUNT }, (_, i) => {
        const done = i < run.wheelIndex;
        const current = i === run.wheelIndex;
        const accent = getWheelArchetypeMetaForIndex(i).accent;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              done && { backgroundColor: accent, opacity: 0.55 },
              current && { backgroundColor: accent, transform: [{ scale: 1.35 }], borderColor: Neo.ink },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(250,250,250,0.35)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
