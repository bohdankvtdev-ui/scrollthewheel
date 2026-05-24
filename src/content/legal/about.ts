import { APP_DISPLAY_NAME } from "../../constants/appBranding";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, MARKETING_SITE_URL } from "../../constants/legal";

export const ABOUT_TITLE = "About";

export const ABOUT_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: APP_DISPLAY_NAME,
    body: "A roguelike money run built around nine wheels per cycle — spin wedges, buy perks, dodge bankruptcy, and push through endless cycles.",
  },
  {
    heading: "How to play",
    body: "Start at $0. Scroll through nine wheels per cycle, claim each wedge, spend chips in shops between spins, and clear the boss on wheel 9 to advance. Hit $0 bank after you've spun and the run ends.",
  },
  {
    heading: "Legal & support",
    body: `Privacy, terms, cookies, credits, and FAQ live in this app and on ${MARKETING_SITE_URL}. Use the links below to open each page in your browser or read credits in-app.`,
  },
  {
    heading: "Contact",
    body: `Email: ${LEGAL_CONTACT_EMAIL}\n\nLast updated: ${LEGAL_LAST_UPDATED}`,
  },
];
