import { StyleSheet, View } from "react-native";
import { WHEEL_COUNT } from "../../game/loop";
import { getWheelArchetypeMetaForIndex } from "../../data/wheelArchetypeMeta";
import { Neo } from "../../../theme/neoBrutal";
import { WheelMapIcon } from "./WheelMapIcon";

type RunProgressPipsProps = {
  wheelIndex: number;
};

export function RunProgressPips({ wheelIndex }: RunProgressPipsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: WHEEL_COUNT }, (_, i) => {
        const meta = getWheelArchetypeMetaForIndex(i);
        const done = i < wheelIndex;
        const current = i === wheelIndex;
        const iconColor = current ? Neo.ink : done ? Neo.ink : "rgba(250,250,250,0.45)";

        return (
          <View
            key={i}
            style={[
              styles.pip,
              done && [styles.pipDone, { backgroundColor: meta.accent }],
              current && [styles.pipCurrent, { backgroundColor: meta.accent }],
            ]}
            accessibilityLabel={`${meta.tag}${current ? ", current" : done ? ", done" : ""}`}
          >
            <WheelMapIcon meta={meta} size={current ? 16 : 13} color={iconColor} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "center",
    gap: 3,
    marginTop: 4,
  },
  pip: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  pipDone: {
    borderColor: Neo.ink,
    opacity: 0.72,
  },
  pipCurrent: {
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    transform: [{ scale: 1.08 }],
  },
});
