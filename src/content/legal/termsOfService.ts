import { APP_DISPLAY_NAME } from "../../constants/appBranding";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "../../constants/legal";

export const TERMS_OF_SERVICE_TITLE = "Terms of Service";

export const TERMS_OF_SERVICE_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Agreement",
    body: `These Terms govern your use of the ${APP_DISPLAY_NAME} mobile application and related services. By downloading or playing, you agree to these Terms.`,
  },
  {
    heading: "License",
    body: `We grant you a personal, non-exclusive, non-transferable, revocable license to use ${APP_DISPLAY_NAME} for private, non-commercial entertainment. You may not copy, modify, reverse-engineer, or redistribute the app except as allowed by law.`,
  },
  {
    heading: "Virtual items",
    body: "Bank balance, chips, perks, wheels, and other in-game values are licensed, not sold, and have no real-world cash value. We may balance, change, or remove content at any time. Progress may be lost if you delete the app or change devices.",
  },
  {
    heading: "Acceptable use",
    body: "You agree not to cheat, exploit bugs for unfair advantage, use unauthorized automation, or harass others in support channels.",
  },
  {
    heading: "Disclaimer",
    body: `${APP_DISPLAY_NAME} is provided "as is" without warranties. Gambling-style visuals do not constitute real-money gambling.`,
  },
  {
    heading: "Limitation of liability",
    body: "To the maximum extent permitted by law, we are not liable for indirect or consequential damages. Liability is limited to amounts you paid for the app in the prior twelve months, or zero if the app was free.",
  },
  {
    heading: "Changes",
    body: "We may update these Terms. Continued use after updates constitutes acceptance.",
  },
  {
    heading: "Contact",
    body: LEGAL_CONTACT_EMAIL,
  },
];

export const TERMS_OF_SERVICE_META = `Last updated: ${LEGAL_LAST_UPDATED}`;
