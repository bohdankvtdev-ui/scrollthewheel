import type { Animated } from "react-native";
import type { ReactNode } from "react";
import type { WheelPhysicsConfig } from "../../lib/wheel/types";

export type SpinWheelIconFamily = "MaterialIcons" | "MaterialCommunityIcons" | "Ionicons";

export type SpinWheelItem = {
  id: string;
  image?: unknown;
  label?: string;
  /** Compact wedge caption ($50, PERK, ALL). */
  shortLabel?: string;
  icon?: string;
  iconFamily?: SpinWheelIconFamily;
  /** @deprecated Prefer iconChipBg */
  iconTint?: string;
  iconChipBg?: string;
  iconColor?: string;
  captionColor?: string;
  iconTone?: import("../../src/game/content/sliceVisualTheme").SliceVisualTone;
};

export type SpinWheelProps = {
  data: SpinWheelItem[];
  size?: number;
  /** Spin kinematics + decel — from `WheelExperienceProfile` / `resolveWheelPhysics`. */
  wheelPhysics: WheelPhysicsConfig;
  knobComponent?: ReactNode;
  onSpinEnd?: (item: SpinWheelItem, index: number) => void;
  textColor?: string;
  textSize?: number;
  textFontWeight?: string;
  segmentBgColor?: string | string[];
  /** Hairline stroke between slices. */
  segmentStrokeColor?: string;
  segmentStrokeWidth?: number;
  showResultText?: boolean;
  showSpinButton?: boolean;
  /** When true, spin control is a fixed hub over the wheel center (does not rotate). */
  centerSpinButton?: boolean;
  /** Soft shadow under the hub image (off by default — prefer ink border ring). */
  hubSoftShadow?: boolean;
  /** Hub center label typography (e.g. Bebas Neue). */
  hubLabelFontFamily?: string;
  hubLabelColor?: string;
  /** Ink ring around the hub image (neo-brutal frame). */
  hubRingBorderWidth?: number;
  hubRingBorderColor?: string;
  /** Prize slice labels (SVG). */
  labelFontFamily?: string;
  /** Arc corner radius; scales with `size` when omitted. */
  segmentCornerRadius?: number;
  /** Gap between slices in radians (small = tighter wheel). */
  segmentPadAngle?: number;
  /** When true, prize slice stroke uses bulb halo gradient (use only during win celebration). */
  prizeSliceVictoryShine?: boolean;
  onSpinPress?: () => void;
  /** When true, the spin control is disabled (e.g. locked until prior steps complete). */
  spinLocked?: boolean;
  /** Center hub label + press behavior. */
  hubMode?: "spin" | "claim" | "busy";
  /** Fires when `hubMode` is `claim` (prize won — advance to next wheel). */
  onHubClaimPress?: () => void;
  /** `icons` hides wedge text and draws icon chips on slices. */
  sliceLabelMode?: "text" | "icons" | "both";
  /** Softer hub pulse while spinning (less visual jump). */
  hubAnimSubtle?: boolean;
  /** When true, hub press only fires `onSpinPress` — parent must call `spinToIndex` via ref. */
  externalSpinControl?: boolean;
  /** Monotonic id from parent so hub `onLoad` can be matched to the current surface (avoids stale callbacks). */
  hubLoadEpoch?: number;
  /** Fires when the center hub image has finished decoding (or on decode error). Passes `hubLoadEpoch`. */
  onHubImageLoad?: (epoch: number) => void;
  /**
   * Prize-disc “lift” pulse while spinning — share with sibling chrome (e.g. bulb ring) so motion matches.
   */
  syncDiscScale?: Animated.Value;
  /** Tap a wedge to preview its prize (disabled while spinning). */
  onSlicePress?: (index: number) => void;
  slicePressEnabled?: boolean;
};

export type SpinWheelRef = {
  spin: () => void;
  spinToIndex: (index: number) => void;
};
