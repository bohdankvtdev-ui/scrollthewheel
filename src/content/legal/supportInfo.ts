import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "../../constants/legal";

export const SUPPORT_TITLE = "Support & FAQ";

export const SUPPORT_INTRO =
  "Need help with Scroll The Wheel? Read the FAQ below or email us — we aim to reply within a few business days.";

export const SUPPORT_FAQ: { q: string; a: string }[] = [
  {
    q: "How do I start a run?",
    a: "Begin with $0 in the bank. Spin wheel 1, swipe up to claim your wedge, and move through nine wheels per cycle. Spend chips in the shop when offers appear.",
  },
  {
    q: "What ends a run?",
    a: "If your bank reaches $0 (and shields or rescue tactics do not save you), the run ends. You can restart and try a new build.",
  },
  {
    q: "What happens after wheel 9?",
    a: "You clear the cycle, collect rewards, pick an optional pit-stop bonus, then continue at wheel 1 of the next cycle with tougher scaling.",
  },
  {
    q: "Are purchases real money?",
    a: "In-game bank and chips are virtual. Any future real-money purchases will be disclosed clearly in the app and store listings.",
  },
  {
    q: "How do I delete my data?",
    a: "Uninstall the app or clear app storage on your device. Email us if you contacted support and want correspondence removed.",
  },
];

export const SUPPORT_META = `Last updated: ${LEGAL_LAST_UPDATED} · ${LEGAL_CONTACT_EMAIL}`;
