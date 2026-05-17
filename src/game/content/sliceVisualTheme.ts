import type { WheelArchetype } from "../wheels/types";
import type { SliceKind, SliceWeightTag } from "../../schemas";
import { SLICES_PER_WHEEL } from "../wheels/database/constants";

export type SliceVisualTone = "gain" | "loss" | "stakes" | "jackpot" | "perk" | "deck" | "curse" | "neutral";

/** One wedge slot — slice fill + partner icon ink (curated contrast pairs). */
export type SliceSlotPalette = {
  /** Bright prize wedge fill */
  segment: string;
  /** Icon glyph — partner color tuned for this slice */
  icon: string;
  /** Caption text — slightly darker partner */
  caption: string;
  /** Flash / dock chip background */
  chip: string;
  tone: SliceVisualTone;
};

/**
 * Partner palette — slice color + matched icon ink (slots 0–5, every wheel).
 *
 * | Slot | Slice   | Icon (partner)   |
 * |------|---------|------------------|
 * | 0    | Pink    | Navy #1E2B6A    |
 * | 1    | Orange  | Slate #334155   |
 * | 2    | Gold    | Mahogany #5C2C1A |
 * | 3    | Lime    | Indigo #4338CA  |
 * | 4    | Cyan    | Dark gold #B45309 |
 * | 5    | Violet  | Teal #0F766E    |
 */
const CORE_SLICE_PALETTES: readonly SliceSlotPalette[] = [
  {
    segment: "#FF5C8A",
    icon: "#1E2B6A",
    caption: "#151F47",
    chip: "#FECDD3",
    tone: "gain",
  },
  {
    segment: "#FF9F43",
    icon: "#334155",
    caption: "#1E293B",
    chip: "#FFEDD5",
    tone: "stakes",
  },
  {
    segment: "#FFE566",
    icon: "#5C2C1A",
    caption: "#451F12",
    chip: "#FEF9C3",
    tone: "jackpot",
  },
  {
    segment: "#BEF264",
    icon: "#4338CA",
    caption: "#3730A3",
    chip: "#ECFCCB",
    tone: "gain",
  },
  {
    segment: "#5CE1FF",
    icon: "#B45309",
    caption: "#92400E",
    chip: "#CFFAFE",
    tone: "deck",
  },
  {
    segment: "#C4B5FD",
    icon: "#0F766E",
    caption: "#0D5C57",
    chip: "#EDE9FE",
    tone: "perk",
  },
];

const EXTENDED_SLICE_PALETTES: readonly SliceSlotPalette[] = [
  {
    segment: "#FDA4AF",
    icon: "#881337",
    caption: "#4C0519",
    chip: "#FFE4E6",
    tone: "gain",
  },
  {
    segment: "#86EFAC",
    icon: "#14532D",
    caption: "#052E16",
    chip: "#DCFCE7",
    tone: "gain",
  },
  {
    segment: "#93C5FD",
    icon: "#1E3A8A",
    caption: "#172554",
    chip: "#DBEAFE",
    tone: "deck",
  },
  {
    segment: "#FDE047",
    icon: "#713F12",
    caption: "#422006",
    chip: "#FEF9C3",
    tone: "jackpot",
  },
  {
    segment: "#F9A8D4",
    icon: "#831843",
    caption: "#500724",
    chip: "#FCE7F3",
    tone: "perk",
  },
  {
    segment: "#67E8F9",
    icon: "#164E63",
    caption: "#083344",
    chip: "#CFFAFE",
    tone: "neutral",
  },
];

export const SLICE_SLOT_PALETTES: readonly SliceSlotPalette[] = [
  ...CORE_SLICE_PALETTES,
  ...EXTENDED_SLICE_PALETTES,
];

/** @deprecated Use SLICE_SLOT_PALETTES[].segment */
export const RAINBOW_SLICE_COLORS: readonly [string, string, string, string, string, string] = [
  SLICE_SLOT_PALETTES[0].segment,
  SLICE_SLOT_PALETTES[1].segment,
  SLICE_SLOT_PALETTES[2].segment,
  SLICE_SLOT_PALETTES[3].segment,
  SLICE_SLOT_PALETTES[4].segment,
  SLICE_SLOT_PALETTES[5].segment,
];

export type SliceVisualTheme = {
  tone: SliceVisualTone;
  segmentBg: string;
  chipBg: string;
  iconColor: string;
  captionColor: string;
};

/** Bulb ring circle + bulb base tint per wheel archetype. */
export type BulbRingPalette = {
  ringFill: string;
  ringFillHighlight: string;
  ringFillShadow: string;
  bulbDim: string;
  bulbMid: string;
};

export const WHEEL_BULB_RING_PALETTES: Record<WheelArchetype, BulbRingPalette> = {
  money: {
    ringFill: "#FF2D55",
    ringFillHighlight: "#FF8FA3",
    ringFillShadow: "#BE123C",
    bulbDim: "#E11D48",
    bulbMid: "#FB7185",
  },
  percent: {
    ringFill: "#FF6B00",
    ringFillHighlight: "#FFB347",
    ringFillShadow: "#C2410C",
    bulbDim: "#EA580C",
    bulbMid: "#FB923C",
  },
  risk: {
    ringFill: "#FF1493",
    ringFillHighlight: "#FF8AC4",
    ringFillShadow: "#BE185D",
    bulbDim: "#DB2777",
    bulbMid: "#F472B6",
  },
  joker_offer: {
    ringFill: "#8B5CF6",
    ringFillHighlight: "#D8B4FE",
    ringFillShadow: "#6D28D9",
    bulbDim: "#7C3AED",
    bulbMid: "#C4B5FD",
  },
  drain: {
    ringFill: "#6B7280",
    ringFillHighlight: "#D1D5DB",
    ringFillShadow: "#374151",
    bulbDim: "#4B5563",
    bulbMid: "#9CA3AF",
  },
  lucky: {
    ringFill: "#FFD600",
    ringFillHighlight: "#FFF176",
    ringFillShadow: "#CA8A04",
    bulbDim: "#EAB308",
    bulbMid: "#FDE047",
  },
  builder: {
    ringFill: "#00B4D8",
    ringFillHighlight: "#7EE8FA",
    ringFillShadow: "#0E7490",
    bulbDim: "#0891B2",
    bulbMid: "#67E8F9",
  },
  jackpot: {
    ringFill: "#FFAB00",
    ringFillHighlight: "#FFE566",
    ringFillShadow: "#D97706",
    bulbDim: "#F59E0B",
    bulbMid: "#FCD34D",
  },
  curse: {
    ringFill: "#78716C",
    ringFillHighlight: "#E7E5E4",
    ringFillShadow: "#44403C",
    bulbDim: "#57534E",
    bulbMid: "#D6D3D1",
  },
  boss: {
    ringFill: "#FF1744",
    ringFillHighlight: "#FF8A80",
    ringFillShadow: "#B71C1C",
    bulbDim: "#D50000",
    bulbMid: "#FF5252",
  },
};

const DEFAULT_BULB_PALETTE = WHEEL_BULB_RING_PALETTES.money;

function toneForKind(kind: SliceKind, tags?: readonly SliceWeightTag[]): SliceVisualTone {
  if (kind === "money") {
    return tags?.includes("rare") ? "jackpot" : "gain";
  }
  if (kind === "money_loss" || kind === "debuff") return "loss";
  if (kind === "bank_wipe" || kind === "bank_cut") {
    if (tags?.includes("positive")) return "jackpot";
    return "stakes";
  }
  if (kind === "perk" || kind === "booster") return "perk";
  if (kind === "deck_add" || kind === "deck_remove" || kind === "deck_upgrade") return "deck";
  if (kind === "relic_offer") return "jackpot";
  return "neutral";
}

function clampIndex(index: number, max: number): number {
  return Math.max(0, Math.min(max - 1, index));
}

export function getSliceSlotPalette(sliceIndex: number, sliceCount?: number): SliceSlotPalette {
  const max = sliceCount ?? SLICE_SLOT_PALETTES.length;
  return SLICE_SLOT_PALETTES[clampIndex(sliceIndex, max)]!;
}

export function getWheelSliceSegmentColor(sliceIndex: number, sliceCount?: number): string {
  return getSliceSlotPalette(sliceIndex, sliceCount).segment;
}

/** Flash / dock when slice index unknown — falls back to kind hue. */
export function getSliceIconColor(kind: SliceKind, tags?: readonly SliceWeightTag[]): string {
  const tone = toneForKind(kind, tags);
  const byTone: Record<SliceVisualTone, string> = {
    gain: "#9F1239",
    loss: "#991B1B",
    stakes: "#C2410C",
    jackpot: "#A16207",
    perk: "#5B21B6",
    deck: "#0E7490",
    curse: "#44403C",
    neutral: "#374151",
  };
  return byTone[tone];
}

export function getBulbRingPalette(archetype?: WheelArchetype): BulbRingPalette {
  if (archetype == null) return DEFAULT_BULB_PALETTE;
  return WHEEL_BULB_RING_PALETTES[archetype];
}

export type SliceVisualOptions = {
  sliceIndex?: number;
  sliceCount?: number;
  wheelArchetype?: WheelArchetype;
};

export function getSliceVisualTheme(
  kind: SliceKind,
  tags?: readonly SliceWeightTag[],
  options: SliceVisualOptions = {}
): SliceVisualTheme {
  const slot = getSliceSlotPalette(options.sliceIndex ?? 0, options.sliceCount);
  return {
    tone: slot.tone,
    segmentBg: slot.segment,
    chipBg: slot.chip,
    iconColor: slot.icon,
    captionColor: slot.caption,
  };
}

export function getWheelSegmentColors(
  slices: ReadonlyArray<{
    kind: SliceKind;
    weightTags?: SliceWeightTag[];
    presentation?: { segmentColor?: string; iconColor?: string };
  }>,
  _archetype?: WheelArchetype
): string[] {
  return slices.map((slice, index) => {
    if (slice.presentation?.segmentColor != null) {
      return slice.presentation.segmentColor;
    }
    return getWheelSliceSegmentColor(index);
  });
}

/** @deprecated */
export function sliceAccentForKind(_kind: SliceKind, fallbackIndex = 0): string {
  return getWheelSliceSegmentColor(fallbackIndex);
}

/** @deprecated */
export const WHEEL_SEGMENT_PALETTES = { money: RAINBOW_SLICE_COLORS } as const;
