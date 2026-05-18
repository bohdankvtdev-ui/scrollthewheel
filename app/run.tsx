import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RunScreen } from "../src/screens/RunScreen";

export default function RunRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RunScreen />
    </GestureHandlerRootView>
  );
}
