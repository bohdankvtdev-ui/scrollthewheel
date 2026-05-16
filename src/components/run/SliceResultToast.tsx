import { StyleSheet, View } from "react-native";
import { Neo, neoCardStyle } from "../../../theme/neoBrutal";
import type { RunState } from "../../schemas";
import { toSliceDisplay } from "../../utils/sliceDisplay";
import { EffectIcon } from "./EffectIcon";

type SliceResultToastProps = {
  run: RunState;
  sliceId: string | null;
};

export function SliceResultToast({ run, sliceId }: SliceResultToastProps) {
  if (sliceId == null) return null;
  const wheel = run.wheels[run.wheelIndex];
  const slice = wheel?.slices.find((s) => s.id === sliceId);
  if (slice == null) return null;

  const display = toSliceDisplay(slice);

  return (
    <View style={styles.wrap}>
      <View style={[neoCardStyle(), styles.card]}>
        <EffectIcon
          icon={display.icon}
          iconFamily={display.iconFamily}
          effectHint={display.effectHint}
          size="lg"
          accentBg={Neo.neonYellow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 88,
    left: 16,
    right: 16,
    zIndex: 20,
    alignItems: "center",
  },
  card: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    alignItems: "center",
  },
});
