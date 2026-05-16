import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { WHEEL_ROLE_META } from "../../data/wheelRoleMeta";
import { RUN_PIPELINE } from "../../data/wheels/runPipeline";
import { Neo } from "../../../theme/neoBrutal";

type RunProgressPipsProps = {
  wheelIndex: number;
};

export function RunProgressPips({ wheelIndex }: RunProgressPipsProps) {
  return (
    <View style={styles.row}>
      {RUN_PIPELINE.map((w, i) => {
        const meta = WHEEL_ROLE_META[w.role];
        const done = i < wheelIndex;
        const current = i === wheelIndex;
        const Icon =
          meta.iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : MaterialIcons;
        return (
          <View
            key={w.id}
            style={[
              styles.pip,
              done && styles.pipDone,
              current && [styles.pipCurrent, { backgroundColor: meta.accent }],
            ]}
            accessibilityLabel={`${meta.tag}${current ? ", current" : done ? ", done" : ""}`}
          >
            <Icon
              name={meta.icon as never}
              size={current ? 16 : 13}
              color={current ? Neo.ink : done ? Neo.ink : "rgba(250,250,250,0.45)"}
            />
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
    backgroundColor: Neo.neonCyan,
    borderColor: Neo.ink,
  },
  pipCurrent: {
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    transform: [{ scale: 1.08 }],
  },
});
