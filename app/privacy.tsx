import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  PRIVACY_POLICY_META,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_TITLE,
} from "../src/content/legal/privacyPolicy";
import { LegalDocumentScreen } from "../src/screens/LegalDocumentScreen";

export default function PrivacyRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LegalDocumentScreen
        title={PRIVACY_POLICY_TITLE}
        meta={PRIVACY_POLICY_META}
        sections={PRIVACY_POLICY_SECTIONS}
        legalHubExcludeId="privacy"
      />
    </GestureHandlerRootView>
  );
}
