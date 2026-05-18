import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HomeScreen } from "../src/screens/HomeScreen";

/** App entry — mode picker at `/` (refresh lands here). */
export default function IndexRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HomeScreen />
    </GestureHandlerRootView>
  );
}
