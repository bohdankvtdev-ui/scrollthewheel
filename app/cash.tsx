import "../global.css";
import { CashSpinScreen } from "../features/cash-spin/CashSpinScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function CashSpinRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CashSpinScreen />
    </GestureHandlerRootView>
  );
}
