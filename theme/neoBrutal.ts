import type { TextStyle, ViewStyle } from "react-native";
import { FONT_BEBAS_NEUE } from "./fonts";

/** Neo-brutalist shell — balanced with softer surfaces; organic accents. */
export const Neo = {
  /** App field — rich purple (bulb ring uses harmonizing rose-crimson). */
  pageBg: "#4A2574",
  ink: "#0A0A0A",
  inkMuted: "rgba(10, 10, 10, 0.62)",
  /** Text on dark / red surfaces */
  textOnDark: "#FAFAFA",
  textMutedOnDark: "rgba(250, 250, 250, 0.7)",
  surface: "rgba(255, 255, 255, 0.1)",
  surfaceDark: "#2D1B4E",
  /** Wheel prize labels — strong contrast on bright slices. */
  wheelSliceLabel: "rgba(15, 23, 42, 0.92)",
  /** Top bar: solid ink — brutal strip on light page */
  headerBg: "#0A0A0A",
  headerBorder: "#0A0A0A",
  headerText: "#FAFAFA",
  headerTextMuted: "rgba(250, 250, 250, 0.45)",
  /** Classic neo-brutal red (accents, spin hub, pointer). */
  accent: "#E11D48",
  accentInk: "#0A0A0A",
  neonYellow: "#FACC15",
  neonCyan: "#22D3EE",
  neonMagenta: "#FB7185",
  /** Prize slices — vivid organic brights. */
  segmentColors: [
    "#FDE047",
    "#7DD3FC",
    "#4ADE80",
    "#FB7185",
    "#C4B5FD",
    "#FB923C",
  ] as const,
  borderBold: 5,
  borderThin: 3,
  radiusCard: 12,
  radiusButton: 14,
  shadowHard: { width: 5, height: 5 } as const,
  shadowSoftLift: { width: 0, height: 3 } as const,
} as const;

/** Bulb ring — rose-crimson field; chase + lightning; flat fills + ink border (no elevation shadow). */
export const NeoBulbRingTheme = {
  ringFill: "#D63D6B",
  ringFillHighlight: "#FBCFE8",
  ringFillShadow: "#9D174D",
  ringFillStroke: "rgba(10, 10, 10, 0.55)",
  ringBorderIdle: "rgba(10, 10, 10, 0.35)",
  ringBorderVictory: "#FDE047",
  ringBorderWidthIdle: 3,
  bulbDim: "#5A2038",
  bulbMid: "#8B3A4F",
  bulbHot: "#FDE047",
  /** Peak idle specular (chase head + strong strikes). */
  bulbShine: "#FFFBEB",
  bulbRimDim: "rgba(45, 10, 35, 0.5)",
  bulbRimHot: "rgba(254, 249, 195, 0.92)",
  /** Under-bulb cast (purple depth). */
  bulbShadowCast: "rgba(28, 8, 48, 0.82)",
  /** Wide soft corona around bright strikes + chase head. */
  bulbLightningHalo: "rgba(253, 224, 71, 0.58)",
  bulbLightningHaloCore: "rgba(255, 255, 255, 0.36)",
  /** Full-opacity rim lines — same RGB family as `bulbLightningHalo` / `bulbLightningHaloCore` (prize slice stroke). */
  bulbHaloRimOuterSolid: "rgb(253, 224, 71)",
  bulbHaloRimInnerSolid: "rgb(255, 252, 245)",
  victoryFill: "#EAB308",
  victoryFillCore: "#FFFBEB",
  victoryStroke: "rgba(69, 10, 10, 0.88)",
  victoryGlow: "#FACC15",
  victoryHoldMs: 2800,
  victoryFadeMs: 900,
} as const;

/** Wheel slice + hub — sharp wedges; default rim is ink; victory shine is opt-in from parent. */
export const NeoWheel = {
  segmentStroke: Neo.ink,
  segmentStrokeWidth: 3,
  segmentPadAngle: 0.003,
  segmentCornerRadius: 0,
  hubBackground: "#FFFBEB",
  hubBorder: "#0A0A0A",
  hubBorderWidth: 0,
  hubText: "#0A0A0A",
} as const;

/**
 * Pass into `computeBulbRingLayout` so bulb centers sit between the wheel rim and the
 * **inner** stroked ring (not the raw layout radius). Must match `NeoBulbRing` chrome.
 */
export const NeoBulbRingLayoutChrome = {
  ringBorderOuterPx: Neo.borderThin,
  /** Matches `NeoBulbRing` `ringStyle` border clamp max (~idle 2 + pulse). */
  ringInnerStrokeMaxPx: 5,
  bulbToStrokeGapPx: 1,
} as const;

export function neoCardStyle(maxWidth?: number): ViewStyle {
  return {
    backgroundColor: Neo.surface,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: Neo.radiusCard,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...(maxWidth != null ? { maxWidth, width: "100%" as const } : {}),
  };
}

/** Full-width app header — same family as page (no white strip). */
export function neoAppHeaderStyle(): ViewStyle {
  return {
    width: "100%",
    backgroundColor: Neo.headerBg,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.headerBorder,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  };
}

export function neoAppHeaderPrize(): TextStyle {
  return {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 24,
    fontWeight: "400",
    color: Neo.headerText,
    letterSpacing: 0.35,
    lineHeight: 28,
  };
}

export function neoPrimaryButtonStyle(pressed: boolean): ViewStyle {
  return {
    backgroundColor: Neo.accent,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: Neo.radiusButton,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    opacity: pressed ? 0.92 : 1,
    transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
  };
}

export function neoTitleStyle(fontSize: number): TextStyle {
  return {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize,
    fontWeight: "400",
    color: Neo.ink,
    letterSpacing: 0.35,
    textAlign: "center",
  };
}

export function neoTitleOnDark(fontSize: number): TextStyle {
  return {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize,
    fontWeight: "400",
    color: Neo.textOnDark,
    letterSpacing: 0.35,
    textAlign: "center",
  };
}

export function neoSubtitleStyle(fontSize: number): TextStyle {
  return {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize,
    fontWeight: "400",
    color: Neo.inkMuted,
    textAlign: "center",
    letterSpacing: 0.4,
  };
}

export function neoSubtitleOnDark(fontSize: number): TextStyle {
  return {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize,
    fontWeight: "400",
    color: Neo.textMutedOnDark,
    textAlign: "center",
    letterSpacing: 0.4,
  };
}

export { FONT_BEBAS_NEUE };
