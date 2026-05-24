import { APP_DISPLAY_NAME } from "../../constants/appBranding";
import { LEGAL_LAST_UPDATED, LEGAL_PRIVACY_EMAIL } from "../../constants/legal";

export const COOKIE_POLICY_TITLE = "Cookie Policy";

export const COOKIE_POLICY_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Scope",
    body: `This policy describes cookies on the ${APP_DISPLAY_NAME} marketing website. The mobile app uses on-device storage for saves and settings — see the Privacy Policy.`,
  },
  {
    heading: "What are cookies?",
    body: "Cookies are small text files stored in your browser. They help sites remember preferences and understand how pages are used.",
  },
  {
    heading: "Cookies we use",
    body: "Strictly necessary cookies support basic site functionality. Optional analytics, if enabled, show aggregate traffic only — not personal identification.",
  },
  {
    heading: "Your choices",
    body: "You can block or delete cookies in your browser settings. Blocking all cookies may affect how some parts of the site work.",
  },
  {
    heading: "Contact",
    body: LEGAL_PRIVACY_EMAIL,
  },
];

export const COOKIE_POLICY_META = `Last updated: ${LEGAL_LAST_UPDATED}`;
