import { APP_DISPLAY_NAME } from "../../constants/appBranding";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "../../constants/legal";

export const PRIVACY_POLICY_TITLE = "Privacy Policy";

export const PRIVACY_POLICY_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Overview",
    body: `${APP_DISPLAY_NAME} is a single-player game. We designed it so your runs and settings stay on your device unless you choose to share something with us (for example, by email).`,
  },
  {
    heading: "Information we collect",
    body: `The app may store game progress locally on your device (run state, high scores, chip totals, and preferences). We do not require an account to play.\n\nIf you contact us at ${LEGAL_CONTACT_EMAIL}, we receive whatever you include in your message.`,
  },
  {
    heading: "Information we do not collect",
    body: "We do not ask for your name, address, or payment details inside the game. We do not sell personal information.",
  },
  {
    heading: "Analytics and crash reports",
    body: "Future versions may use anonymized analytics or crash reporting to improve stability. If we add these services, this policy will be updated before they are enabled in production builds.",
  },
  {
    heading: "Children",
    body: "The game is not directed at children under 13. We do not knowingly collect personal information from children.",
  },
  {
    heading: "Your choices",
    body: "You can delete local progress by clearing app data in your device settings or reinstalling the app.",
  },
  {
    heading: "Changes",
    body: `We may update this policy from time to time. The “Last updated” date at the top reflects the latest version.`,
  },
  {
    heading: "Contact",
    body: `Questions about privacy: ${LEGAL_CONTACT_EMAIL}`,
  },
];

export const PRIVACY_POLICY_META = `Last updated: ${LEGAL_LAST_UPDATED}`;
