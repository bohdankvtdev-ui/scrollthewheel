import type { TextStyle, ViewStyle } from "react-native";
import { Neo, NeoBulbRingTheme, NeoWheel } from "./neoBrutal";

const RUN_PAGE_BACKGROUND = "#1a1428";

/** Prize slices + neons — matches in-run wheel. */
export const HomeGameColors = [
  ...Neo.segmentColors,
  Neo.neonYellow,
  Neo.neonCyan,
  Neo.neonMagenta,
  Neo.accent,
  NeoBulbRingTheme.ringFill,
  NeoBulbRingTheme.victoryGlow,
] as const;

export const HomePalette = {
  yellow: Neo.neonYellow,
  cyan: Neo.neonCyan,
  magenta: Neo.neonMagenta,
  red: Neo.accent,
  green: Neo.segmentColors[2],
  blue: Neo.segmentColors[1],
  pink: Neo.segmentColors[3],
  purple: Neo.segmentColors[4],
  orange: Neo.segmentColors[5],
  purpleBright: "#EDE9FE",
  greenBright: "#DCFCE7",
  ring: NeoBulbRingTheme.ringFill,
} as const;

export const HomeScreenTheme = {
  background: RUN_PAGE_BACKGROUND,
  ink: Neo.ink,
  sticker: HomePalette.yellow,
  stickerAlt: HomePalette.cyan,
  panelDark: "#322848",
  textOnDark: Neo.textOnDark,
  textMutedOnDark: "rgba(250, 250, 250, 0.82)",
  textOnSticker: Neo.ink,
  textMutedSticker: Neo.inkMuted,
  accent: HomePalette.red,
  continue: HomePalette.green,
  kicker: HomePalette.yellow,
  hub: NeoWheel.hubBackground,
  borderBold: Neo.borderBold,
  borderThin: Neo.borderThin,
  radius: Neo.radiusCard,
  radiusBtn: Neo.radiusButton,
  shadowHard: Neo.shadowHard,
  wheelSlices: Neo.segmentColors,
} as const;

export function homeBrutalCard(fill: string, extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: fill,
    borderWidth: HomeScreenTheme.borderBold,
    borderColor: HomeScreenTheme.ink,
    borderRadius: HomeScreenTheme.radius,
    padding: 14,
    gap: 10,
    shadowColor: HomeScreenTheme.ink,
    shadowOffset: HomeScreenTheme.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    ...extra,
  };
}

export function homeBrutalButton(fill: string, extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: fill,
    borderWidth: HomeScreenTheme.borderBold,
    borderColor: HomeScreenTheme.ink,
    borderRadius: HomeScreenTheme.radiusBtn,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: HomeScreenTheme.ink,
    shadowOffset: HomeScreenTheme.shadowHard,
    shadowOpacity: 1,
    shadowRadius: 0,
    ...extra,
  };
}

export function homeKickerStyle(): TextStyle {
  return {
    fontSize: 11,
    color: HomeScreenTheme.kicker,
    letterSpacing: 0.85,
    textTransform: "uppercase",
  };
}

export function homeBodyOnDark(): TextStyle {
  return {
    fontSize: 14,
    lineHeight: 19,
    color: HomeScreenTheme.textMutedOnDark,
    letterSpacing: 0.15,
  };
}

export function homeBodyOnSticker(): TextStyle {
  return {
    fontSize: 14,
    lineHeight: 19,
    color: HomeScreenTheme.textMutedSticker,
    letterSpacing: 0.15,
  };
}
