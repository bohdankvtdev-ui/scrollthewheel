import { HomeGameColors } from "../../../theme/homeScreen";

export type DecorWheelSpec = {
  id: string;
  size: number;
  left: number;
  top: number;
  durationMs: number;
  reverse: boolean;
  opacity: number;
  colors: readonly string[];
  /** Max px offset for smooth float (not animated as absolute target). */
  driftAmpX: number;
  driftAmpY: number;
  driftDurationMs: number;
  /** 0–1 phase offset so wheels don't move in sync. */
  driftPhase: number;
};

const SLOT_COLORS: readonly (readonly string[])[] = [
  [HomeGameColors[0], HomeGameColors[1], HomeGameColors[2], HomeGameColors[3], HomeGameColors[4], HomeGameColors[5]],
  [HomeGameColors[2], HomeGameColors[4], HomeGameColors[6], HomeGameColors[1], HomeGameColors[3], HomeGameColors[5]],
  [HomeGameColors[5], HomeGameColors[3], HomeGameColors[7], HomeGameColors[0], HomeGameColors[2], HomeGameColors[4]],
] as const;

/**
 * Exactly 3 decor wheels — fixed anchors:
 * 1) top-left  2) middle-right  3) bottom-center
 */
export function buildDecorWheels(width: number, height: number): DecorWheelSpec[] {
  if (width < 200 || height < 400) return [];

  const size = Math.round(Math.min(width * 0.62, height * 0.34, 268));

  const topLeft = {
    id: "w-tl",
    size,
    left: Math.round(-size * 0.2),
    top: Math.round(height * 0.04),
  };

  const midRight = {
    id: "w-mr",
    size,
    left: Math.round(width - size * 0.78),
    top: Math.round(height * 0.44 - size * 0.5),
  };

  const bottomMid = {
    id: "w-bm",
    size,
    left: Math.round((width - size) * 0.5),
    top: Math.round(height * 0.8 - size * 0.52),
  };

  const anchors = [topLeft, midRight, bottomMid];

  return anchors.map((a, i) => ({
    ...a,
    durationMs: 14000 + i * 2200,
    reverse: i % 2 === 1,
    opacity: 0.4 + i * 0.04,
    colors: SLOT_COLORS[i]!,
    driftAmpX: 10 + i * 3,
    driftAmpY: 8 + i * 2,
    driftDurationMs: 7000 + i * 900,
    driftPhase: i * 0.33,
  }));
}
