import {
  TERMS_OF_SERVICE_META,
  TERMS_OF_SERVICE_SECTIONS,
  TERMS_OF_SERVICE_TITLE,
} from "../src/content/legal/termsOfService";
import { LegalDocumentScreen } from "../src/screens/LegalDocumentScreen";

export default function TermsRoute() {
  return (
    <LegalDocumentScreen
      title={TERMS_OF_SERVICE_TITLE}
      meta={TERMS_OF_SERVICE_META}
      sections={TERMS_OF_SERVICE_SECTIONS}
      legalHubExcludeId="terms"
    />
  );
}
