import {
  COOKIE_POLICY_META,
  COOKIE_POLICY_SECTIONS,
  COOKIE_POLICY_TITLE,
} from "../src/content/legal/cookiePolicy";
import { LegalDocumentScreen } from "../src/screens/LegalDocumentScreen";

export default function CookiesRoute() {
  return (
    <LegalDocumentScreen
      title={COOKIE_POLICY_TITLE}
      meta={COOKIE_POLICY_META}
      sections={COOKIE_POLICY_SECTIONS}
      legalHubExcludeId="cookies"
    />
  );
}
