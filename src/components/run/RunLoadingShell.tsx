import { ActivityIndicator, StyleSheet, View } from "react-native";
import { RUN_LAYOUT } from "../../../lib/layout/runLayout";
import { Neo } from "../../../theme/neoBrutal";

export function RunLoadingShell() {
  return (
    <View style={styles.root}>
      <View style={{ height: RUN_LAYOUT.bar }} />
      <View style={styles.wheel}>
        <ActivityIndicator size="large" color={Neo.neonYellow} />
      </View>
      <View style={{ height: RUN_LAYOUT.prizeFlash }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Neo.pageBg },
  wheel: { flex: 1, alignItems: "center", justifyContent: "center" },
});
