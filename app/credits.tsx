import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CREDITS_SECTIONS, CREDITS_TITLE } from "../src/content/legal/credits";
import { LegalDocumentScreen } from "../src/screens/LegalDocumentScreen";

export default function CreditsRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LegalDocumentScreen title={CREDITS_TITLE} sections={CREDITS_SECTIONS} />
    </GestureHandlerRootView>
  );
}
