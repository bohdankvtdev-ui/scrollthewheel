import { APP_DISPLAY_NAME } from "../../constants/appBranding";

export const CREDITS_TITLE = "Credits";

export const CREDITS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Game",
    body: `${APP_DISPLAY_NAME}\nA roguelike wheel-run game — spin, shop, survive.`,
  },
  {
    heading: "Development",
    body: "Created by the Scroll The Wheel team.\n\nReplace this section with your studio or individual developer name before App Store submission.",
  },
  {
    heading: "Typography",
    body: "Bebas Neue — Google Fonts (SIL Open Font License).",
  },
  {
    heading: "Icons",
    body: "Material Icons & Material Community Icons — Google.",
  },
  {
    heading: "Open source",
    body: "Built with Expo, React Native, Reanimated, React Native SVG, D3, and Zustand. See project licenses for full attribution.",
  },
  {
    heading: "Thanks",
    body: "To everyone who play-tested, broke the economy, and asked for one more wedge.",
  },
];
