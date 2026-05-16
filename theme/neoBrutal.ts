import type { TextStyle, ViewStyle } from "react-native";
import { FONT_BEBAS_NEUE } from "./fonts";

/** Neo-brutalist shell — bright candy field + ink; balanced stroke weight on the wheel. */
export const Neo = {
  /** Default shell field (Cash reel themes override per page). */
  pageBg: "#6D28D9",
  ink: "#0A0A0A",
  inkMuted: "rgba(10, 10, 10, 0.58)",
  /** Text on dark / red surfaces */
  textOnDark: "#FAFAFA",
  textMutedOnDark: "rgba(250, 250, 250, 0.72)",
  surface: "rgba(255, 255, 255, 0.14)",
  surfaceDark: "#4C1D95",
  /** Wheel prize labels — crisp on neon slices. */
  wheelSliceLabel: "rgba(15, 23, 42, 0.9)",
  /** Top bar: solid ink — brutal strip on light page */
  headerBg: "#0A0A0A",
  headerBorder: "#0A0A0A",
  headerText: "#FAFAFA",
  headerTextMuted: "rgba(250, 250, 250, 0.45)",
  /** Punchy accent (pointer rim pulse, hub energy). */
  accent: "#FF2D55",
  accentInk: "#0A0A0A",
  neonYellow: "#FFEB3B",
  neonCyan: "#22D3EE",
  neonMagenta: "#FB7185",
  /** Prize slices — high-chroma brights (ink-weight slice rims). */
  segmentColors: [
    "#FFE94D",
    "#38BDF8",
    "#4ADE80",
    "#FF6B9D",
    "#C4B5FD",
    "#FDBA74",
  ] as const,
  borderBold: 5.5,
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
  ringFillStroke: "rgba(10, 10, 10, 0.32)",
  ringBorderIdle: "rgba(10, 10, 10, 0.22)",
  ringBorderVictory: "#FFEB3B",
  ringBorderWidthIdle: 1.5,
  bulbDim: "#5A2038",
  bulbMid: "#8B3A4F",
  /** Incandescent filament warmth — deep amber between dim and hot. */
  bulbFilamentAmber: "#EA580C",
  bulbHot: "#FBBF24",
  /** Peak idle specular (filament + glass read). */
  bulbShine: "#FFF8E8",
  bulbRimDim: "rgba(45, 10, 35, 0.5)",
  bulbRimHot: "rgba(254, 249, 195, 0.92)",
  /** Under-bulb cast (purple depth). */
  bulbShadowCast: "rgba(28, 8, 48, 0.82)",
  /** Bloom toward hub when chase is cold — reads like shaded glass. */
  bulbHaloOuterCool: "rgba(96, 38, 58, 0.2)",
  /** Diffused outer bloom — warm tungsten glow through frosted glass. */
  bulbLightningHalo: "rgba(255, 200, 120, 0.52)",
  bulbLightningHaloMid: "rgba(255, 230, 175, 0.38)",
  /** Cool micro-core behind filament (thin glass read). */
  bulbLightningHaloCore: "rgba(255, 252, 248, 0.42)",
  /** Glass glint when bulb is brighter (drawn as offset micro-disc). */
  bulbGlassSpecular: "rgba(255, 255, 255, 0.72)",
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

/** Wheel slice + hub — readable ink rim without “fat” wedges. */
export const NeoWheel = {
  /** Same as `Neo.ink` — matches outer prize-ring border. */
  segmentStroke: Neo.ink,
  segmentStrokeWidth: 2.5,
  segmentPadAngle: 0.0024,
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
  ringBorderOuterPx: 2,
  /** Matches `NeoBulbRing` animated border clamp max (~segmentStroke + burst). */
  ringInnerStrokeMaxPx: 6,
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
