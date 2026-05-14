import type { ReactNode } from "react";
import type { WheelPhysicsConfig } from "../../lib/wheel/types";

export type SpinWheelItem = {
  id: string;
  image?: unknown;
  label?: string;
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
  /** Monotonic id from parent so hub `onLoad` can be matched to the current surface (avoids stale callbacks). */
  hubLoadEpoch?: number;
  /** Fires when the center hub image has finished decoding (or on decode error). Passes `hubLoadEpoch`. */
  onHubImageLoad?: (epoch: number) => void;
};

export type SpinWheelRef = {
  spin: () => void;
};
